const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === "production";

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const RECIPES_FILE = path.join(DATA_DIR, "recipes.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const SESSION_COOKIE_NAME = "sid";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map();
const CLIENT_ORIGINS = String(process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (CLIENT_ORIGINS.includes(origin)) return callback(null, true);
      // Allow localhost origins in development
      if (!IS_PROD && origin.match(/^https?:\/\/localhost(:\d+)?$/)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

async function readArrayFile(filePath) {
  try {
    const file = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeArrayFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function readRecipes() {
  return readArrayFile(RECIPES_FILE);
}

async function writeRecipes(recipes) {
  return writeArrayFile(RECIPES_FILE, recipes);
}

async function readUsers() {
  return readArrayFile(USERS_FILE);
}

async function writeUsers(users) {
  return writeArrayFile(USERS_FILE, users);
}

async function ensureDefaultAdminUser() {
  const users = await readUsers();
  const hasAdmin = users.some((user) => user.username === "admin");
  if (hasAdmin) return;

  const passwordHash = await bcrypt.hash("1234", 10);
  users.push({
    id: Date.now(),
    username: "admin",
    passwordHash,
  });

  await writeUsers(users);
}

function createSession(username) {
  const sid = crypto.randomBytes(32).toString("hex");
  sessions.set(sid, {
    username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return sid;
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

function normalizeIngredients(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => ({
      name: String(item && item.name ? item.name : "").trim(),
      amount: String(item && item.amount ? item.amount : "").trim(),
    }))
    .filter((item) => item.name && item.amount);
}

function sanitizeRecipeInput(input) {
  if (!input) return null;

  const recipe = {
    name: String(input.name || "").trim(),
    category: String(input.category || "").trim(),
    time: Number(input.time),
    ingredients: normalizeIngredients(input.ingredients),
    preparation: String(input.preparation || "").trim(),
  };

  const isValid = Boolean(
    recipe.name &&
      recipe.category &&
      Number.isFinite(recipe.time) &&
      recipe.time > 0 &&
      recipe.ingredients.length > 0 &&
      recipe.preparation,
  );

  return isValid ? recipe : null;
}

function clearSession(res, sid) {
  if (sid) sessions.delete(sid);
  res.clearCookie(SESSION_COOKIE_NAME);
}

function getValidSession(req, res) {
  const sid = req.cookies[SESSION_COOKIE_NAME];
  if (!sid) return null;

  const session = sessions.get(sid);
  if (!session) {
    clearSession(res, sid);
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    clearSession(res, sid);
    return null;
  }

  return { sid, session };
}

function requireAuth(req, res, next) {
  const valid = getValidSession(req, res);
  if (!valid) {
    return res.status(401).json({ message: "No autenticado" });
  }

  req.sessionId = valid.sid;
  req.user = { username: valid.session.username };
  next();
}

app.get("/api/session", (req, res) => {
  const valid = getValidSession(req, res);
  if (!valid) {
    return res.status(401).json({ message: "No autenticado" });
  }

  res.json({ username: valid.session.username });
});

app.post("/api/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({ message: "Credenciales incompletas" });
    }

    const users = await readUsers();
    const user = users.find((candidate) => candidate.username === username);

    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const sid = createSession(user.username);
    res.cookie(SESSION_COOKIE_NAME, sid, {
      httpOnly: true,
      sameSite: IS_PROD ? "none" : "lax",
      maxAge: SESSION_TTL_MS,
      secure: IS_PROD,
    });

    res.json({ username: user.username });
  } catch (_error) {
    res.status(500).json({ message: "Error al iniciar sesion" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    if (username.length < 3 || password.length < 4) {
      return res.status(400).json({ message: "Usuario o contrasena no validos" });
    }

    const users = await readUsers();
    const exists = users.some((candidate) => candidate.username === username);
    if (exists) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    users.push({
      id: Date.now(),
      username,
      passwordHash,
    });
    await writeUsers(users);

    const sid = createSession(username);
    res.cookie(SESSION_COOKIE_NAME, sid, {
      httpOnly: true,
      sameSite: IS_PROD ? "none" : "lax",
      maxAge: SESSION_TTL_MS,
      secure: IS_PROD,
    });

    res.status(201).json({ username });
  } catch (_error) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

app.post("/api/logout", (req, res) => {
  const sid = req.cookies[SESSION_COOKIE_NAME];
  clearSession(res, sid);
  res.status(204).send();
});

app.get("/api/recipes", requireAuth, async (_req, res) => {
  try {
    const recipes = await readRecipes();
    res.json(recipes);
  } catch (_error) {
    res.status(500).json({ message: "No se pudieron cargar las recetas" });
  }
});

app.post("/api/recipes", requireAuth, async (req, res) => {
  try {
    const recipeInput = sanitizeRecipeInput(req.body);
    if (!recipeInput) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const recipes = await readRecipes();
    const recipe = {
      id: Date.now(),
      ...recipeInput,
    };

    recipes.unshift(recipe);
    await writeRecipes(recipes);

    res.status(201).json(recipe);
  } catch (_error) {
    res.status(500).json({ message: "No se pudo guardar la receta" });
  }
});

app.put("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const recipeInput = sanitizeRecipeInput(req.body);
    if (!recipeInput) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const recipes = await readRecipes();
    const recipeIndex = recipes.findIndex((recipe) => recipe.id === id);
    if (recipeIndex === -1) {
      return res.status(404).json({ message: "Receta no encontrada" });
    }

    const updatedRecipe = {
      ...recipes[recipeIndex],
      ...recipeInput,
    };

    recipes[recipeIndex] = updatedRecipe;
    await writeRecipes(recipes);

    res.json(updatedRecipe);
  } catch (_error) {
    res.status(500).json({ message: "No se pudo actualizar la receta" });
  }
});

app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const recipes = await readRecipes();
    const nextRecipes = recipes.filter((recipe) => recipe.id !== id);

    if (nextRecipes.length === recipes.length) {
      return res.status(404).json({ message: "Receta no encontrada" });
    }

    await writeRecipes(nextRecipes);
    res.status(204).send();
  } catch (_error) {
    res.status(500).json({ message: "No se pudo eliminar la receta" });
  }
});

async function bootstrap() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await ensureDefaultAdminUser();

  app.listen(PORT, () => {
    console.log(`API recetas disponible en http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("No se pudo iniciar la API", error);
  process.exit(1);
});
