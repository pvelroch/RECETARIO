<template>
  <main class="app-shell">
    <section :class="['card', isAuthenticated ? 'panel-card' : 'auth-card']">
      <transition name="view-swap" mode="out-in">
        <div :key="isAuthenticated ? `${currentView}-${selectedRecipeId || 'none'}` : authMode" class="view-pane">
          <template v-if="!isAuthenticated">
            <header class="auth-header">
              <div>
                <h1>Mi recetario</h1>
                <p class="muted">Entra con tu cuenta o crea una la primera vez que uses la aplicacion</p>
              </div>
            </header>

            <div class="auth-toggle">
              <button
                type="button"
                :class="authMode === 'login' ? 'ghost active' : 'ghost'"
                @click="setAuthMode('login')"
              >
                Iniciar sesion
              </button>
              <button
                type="button"
                :class="authMode === 'register' ? 'ghost active' : 'ghost'"
                @click="setAuthMode('register')"
              >
                Crear usuario
              </button>
            </div>

            <form class="auth-form" @submit.prevent="submitAuth">
              <label>
                Usuario
                <input
                  v-model.trim="authForm.username"
                  type="text"
                  minlength="3"
                  maxlength="30"
                  autocomplete="username"
                  required
                />
              </label>

              <label>
                Contrasena
                <input
                  v-model="authForm.password"
                  type="password"
                  minlength="4"
                  maxlength="60"
                  :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'"
                  required
                />
              </label>

              <label v-if="authMode === 'register'">
                Confirmar contrasena
                <input
                  v-model="authForm.confirmPassword"
                  type="password"
                  minlength="4"
                  maxlength="60"
                  autocomplete="new-password"
                  required
                />
              </label>

              <button type="submit">
                {{ authMode === "login" ? "Entrar" : "Crear cuenta" }}
              </button>
            </form>

            <p v-if="authError" class="error">{{ authError }}</p>
          </template>

          <template v-else-if="currentView === 'list'">
            <header class="panel-header">
              <div>
                <h1>Mi recetario</h1>
                <p class="muted">Busca por ingredientes y abre una receta para editarla</p>
              </div>
              <div class="header-actions">
                <span class="user-badge">{{ currentUser }}</span>
                <button class="secondary" @click="openImportView">Importar receta</button>
                <button class="ghost" @click="logout">Cerrar sesion</button>
              </div>
            </header>

            <section class="search-box">
              <label>
                Buscar por ingredientes
                <input
                  v-model.trim="ingredientQuery"
                  type="text"
                  placeholder="Ej: tomate, ajo, albahaca"
                />
              </label>
              <p class="muted search-help">Separa varios ingredientes con comas o espacios.</p>
            </section>

            <p v-if="apiError" class="error">{{ apiError }}</p>

            <section class="recipes" v-if="filteredRecipes.length">
              <h2>Recetas guardadas</h2>
              <article
                class="recipe-item recipe-card"
                v-for="recipe in filteredRecipes"
                :key="recipe.id"
                @click="openRecipe(recipe.id)"
              >
                <div class="recipe-top">
                  <h3>{{ recipe.name }}</h3>
                  <span class="recipe-open">Ver detalle</span>
                </div>
                <p>
                  <strong>Categoria:</strong> {{ recipe.category }} |
                  <strong>Tiempo:</strong> {{ recipe.time }} min
                </p>
                <p class="muted inline-ingredients">
                  {{ recipe.ingredients.map((ingredient) => ingredient.name).join(", ") }}
                </p>
              </article>
            </section>

            <p v-else class="muted empty">
              {{ recipes.length ? "No hay recetas que coincidan con la busqueda." : "Aun no hay recetas registradas." }}
            </p>
          </template>

          <template v-else-if="currentView === 'import'">
            <header class="panel-header">
              <div>
                <h1>Importar receta</h1>
                <p class="muted">Pega el texto y guardaremos la receta automaticamente</p>
              </div>
              <div class="header-actions">
                <span class="user-badge">{{ currentUser }}</span>
                <button class="secondary" @click="goBackToList">Volver al listado</button>
                <button class="ghost" @click="logout">Cerrar sesion</button>
              </div>
            </header>

            <section class="import-box">
              <p class="muted import-help">
                Formato recomendado: Nombre, Categoria, Tiempo, Ingredientes y Preparacion.
              </p>
              <textarea
                v-model.trim="importText"
                rows="11"
                placeholder="Nombre: Ensalada mediterranea
Categoria: Entrante
Tiempo: 15
Ingredientes:
- Tomate - 2 unidades
- Pepino - 1 unidad
- Aceite de oliva - 2 cucharadas
Preparacion:
Lavar, cortar y mezclar todos los ingredientes."
              ></textarea>
              <div class="import-actions">
                <button @click="importRecipeFromText">Importar receta</button>
                <button class="secondary" @click="clearImportText">Limpiar</button>
              </div>
              <p v-if="importError" class="error">{{ importError }}</p>
              <p v-if="importSuccess" class="success">{{ importSuccess }}</p>
            </section>
          </template>

          <template v-else-if="selectedRecipe">
            <header class="panel-header">
              <div>
                <h1>{{ selectedRecipe.name }}</h1>
                <p class="muted">Detalle de la receta</p>
              </div>
              <div class="header-actions">
                <span class="user-badge">{{ currentUser }}</span>
                <button class="secondary" @click="goBackToList">Volver al listado</button>
                <button class="ghost" @click="logout">Cerrar sesion</button>
              </div>
            </header>

            <p v-if="apiError" class="error">{{ apiError }}</p>

            <template v-if="isEditing">
              <div class="recipe-edit-form">
                <label>
                  Nombre de la receta
                  <input v-model.trim="editForm.name" type="text" maxlength="80" />
                </label>

                <label>
                  Categoria
                  <select v-model="editForm.category">
                    <option disabled value="">Selecciona una categoria</option>
                    <option>Entrante</option>
                    <option>Principal</option>
                    <option>Postre</option>
                    <option>Bebida</option>
                  </select>
                </label>

                <label>
                  Tiempo (minutos)
                  <input v-model.number="editForm.time" type="number" min="1" max="600" />
                </label>

                <div class="ingredients-block">
                  <span>Ingredientes</span>
                  <div class="ingredient-row" v-for="(ingredient, index) in editForm.ingredients" :key="index">
                    <input v-model.trim="ingredient.name" type="text" placeholder="Ingrediente" />
                    <input
                      v-model.trim="ingredient.amount"
                      type="text"
                      placeholder="Cantidad (ej. 200 g)"
                    />
                    <button
                      type="button"
                      class="danger"
                      @click="removeEditIngredient(index)"
                      :disabled="editForm.ingredients.length === 1"
                    >
                      Quitar
                    </button>
                  </div>
                  <button type="button" class="secondary" @click="addEditIngredient">
                    Agregar ingrediente
                  </button>
                </div>

                <label>
                  Preparacion
                  <textarea v-model.trim="editForm.preparation" rows="6"></textarea>
                </label>
              </div>

              <div class="recipe-actions">
                <button @click="saveRecipe">Guardar cambios</button>
                <button class="secondary" @click="cancelEdit">Cancelar</button>
                <button class="danger" @click="removeRecipe">Eliminar receta</button>
              </div>
            </template>

            <template v-else>
              <article class="recipe-item detail-card">
                <p>
                  <strong>Categoria:</strong> {{ selectedRecipe.category }} |
                  <strong>Tiempo:</strong> {{ selectedRecipe.time }} min
                </p>
                <div>
                  <strong>Ingredientes:</strong>
                  <ul class="ingredients-list">
                    <li v-for="(ingredient, index) in selectedRecipe.ingredients" :key="index">
                      {{ ingredient.name }} - {{ ingredient.amount }}
                    </li>
                  </ul>
                </div>
                <p><strong>Preparacion:</strong> {{ selectedRecipe.preparation }}</p>
              </article>

              <div class="recipe-actions">
                <button @click="startEdit">Editar receta</button>
                <button class="danger" @click="removeRecipe">Eliminar receta</button>
              </div>
            </template>
          </template>
        </div>
      </transition>
    </section>
  </main>
</template>

<script>
const API_BASE = (process.env.VUE_APP_API_URL || "").replace(/\/+$/, "");

function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
}

async function parseApiError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data && data.message ? data.message : fallbackMessage;
  } catch (_error) {
    return fallbackMessage;
  }
}

function parseIngredientLine(rawLine) {
  const cleaned = String(rawLine || "")
    .replace(/^[-*\d.)\s]+/, "")
    .trim();
  if (!cleaned) return null;

  const separator = cleaned.includes(" - ") ? " - " : cleaned.includes(",") ? "," : null;
  if (!separator) {
    return { name: cleaned, amount: "cantidad no indicada" };
  }

  const [name, ...rest] = cleaned.split(separator);
  const amount = rest.join(separator).trim();
  const normalizedName = String(name || "").trim();
  if (!normalizedName) return null;

  return {
    name: normalizedName,
    amount: amount || "cantidad no indicada",
  };
}

function normalizeCategory(rawCategory) {
  const value = String(rawCategory || "").toLowerCase().trim();
  if (!value) return "";
  if (value.includes("entrante")) return "Entrante";
  if (value.includes("postre")) return "Postre";
  if (value.includes("bebida")) return "Bebida";
  if (value.includes("principal")) return "Principal";
  return "";
}

function emptyEditForm() {
  return {
    name: "",
    category: "",
    time: null,
    ingredients: [{ name: "", amount: "" }],
    preparation: "",
  };
}

export default {
  name: "App",
  data() {
    return {
      isAuthenticated: false,
      currentUser: "",
      authMode: "login",
      authError: "",
      authForm: {
        username: "",
        password: "",
        confirmPassword: "",
      },
      apiError: "",
      recipes: [],
      ingredientQuery: "",
      currentView: "list",
      importText: "",
      importError: "",
      importSuccess: "",
      selectedRecipeId: null,
      isEditing: false,
      editForm: emptyEditForm(),
    };
  },
  computed: {
    selectedRecipe() {
      return this.recipes.find((recipe) => recipe.id === this.selectedRecipeId) || null;
    },
    searchTerms() {
      return this.ingredientQuery
        .toLowerCase()
        .split(/[\s,]+/)
        .map((term) => term.trim())
        .filter(Boolean);
    },
    filteredRecipes() {
      if (!this.searchTerms.length) return this.recipes;

      return this.recipes.filter((recipe) => {
        const ingredientText = this.normalizeIngredients(recipe.ingredients)
          .map((ingredient) => ingredient.name.toLowerCase())
          .join(" ");

        return this.searchTerms.every((term) => ingredientText.includes(term));
      });
    },
  },
  created() {
    this.restoreSession();
  },
  methods: {
    resetAppState() {
      this.currentView = "list";
      this.recipes = [];
      this.ingredientQuery = "";
      this.importText = "";
      this.importError = "";
      this.importSuccess = "";
      this.selectedRecipeId = null;
      this.isEditing = false;
      this.editForm = emptyEditForm();
      this.apiError = "";
    },
    setAuthMode(mode) {
      this.authMode = mode;
      this.authError = "";
    },
    async restoreSession() {
      try {
        const response = await apiFetch("/api/session");
        if (!response.ok) return;

        const session = await response.json();
        this.isAuthenticated = true;
        this.currentUser = session.username;
        await this.fetchRecipes();
      } catch (_error) {
        this.isAuthenticated = false;
      }
    },
    async submitAuth() {
      this.authError = "";

      if (this.authMode === "register" && this.authForm.password !== this.authForm.confirmPassword) {
        this.authError = "Las contrasenas no coinciden";
        return;
      }

      const endpoint = this.authMode === "login" ? "/api/login" : "/api/register";

      try {
        const response = await apiFetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.authForm.username,
            password: this.authForm.password,
          }),
        });

        if (response.status === 404) {
          throw new Error("El backend no esta actualizado o no se ha reiniciado");
        }
        if (!response.ok) {
          throw new Error(
            await parseApiError(
              response,
              this.authMode === "login" ? "No se pudo iniciar sesion" : "No se pudo crear el usuario",
            ),
          );
        }

        const data = await response.json();
        this.isAuthenticated = true;
        this.currentUser = data.username;
        this.authForm = {
          username: "",
          password: "",
          confirmPassword: "",
        };
        this.resetAppState();
        await this.fetchRecipes();
      } catch (error) {
        this.authError =
          error && error.message ? error.message : "No hay conexion con la API. Reinicia el backend";
      }
    },
    async logout() {
      try {
        await apiFetch("/api/logout", { method: "POST" });
      } catch (_error) {
        // limpiar estado local aunque falle la peticion
      }

      this.isAuthenticated = false;
      this.currentUser = "";
      this.authMode = "login";
      this.authError = "";
      this.authForm.password = "";
      this.authForm.confirmPassword = "";
      this.resetAppState();
    },
    async fetchRecipes() {
      this.apiError = "";
      try {
        const response = await apiFetch("/api/recipes");
        if (response.status === 401) {
          this.logout();
          return;
        }
        if (!response.ok) {
          throw new Error(await parseApiError(response, "No se pudieron cargar las recetas del servidor"));
        }
        const rawRecipes = await response.json();
        this.recipes = rawRecipes.map((recipe) => ({
          ...recipe,
          ingredients: this.normalizeIngredients(recipe.ingredients),
        }));
      } catch (error) {
        this.apiError = error.message || "No se pudieron cargar las recetas del servidor";
      }
    },
    normalizeIngredients(ingredients) {
      if (Array.isArray(ingredients)) {
        return ingredients
          .map((item) => ({
            name: String(item && item.name ? item.name : "").trim(),
            amount: String(item && item.amount ? item.amount : "").trim(),
          }))
          .filter((item) => item.name && item.amount);
      }

      if (typeof ingredients === "string" && ingredients.trim()) {
        return ingredients
          .split(",")
          .map((text) => text.trim())
          .filter(Boolean)
          .map((name) => ({ name, amount: "cantidad no indicada" }));
      }

      return [];
    },
    openRecipe(id) {
      this.selectedRecipeId = id;
      this.currentView = "detail";
      this.isEditing = false;
      this.apiError = "";
    },
    openImportView() {
      this.currentView = "import";
      this.selectedRecipeId = null;
      this.isEditing = false;
      this.apiError = "";
      this.importError = "";
      this.importSuccess = "";
    },
    clearImportText() {
      this.importText = "";
      this.importError = "";
      this.importSuccess = "";
    },
    parseRecipeText(text) {
      const lines = String(text || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return { error: "Pega una receta en texto para importarla" };
      }

      const recipe = {
        name: "",
        category: "",
        time: null,
        ingredients: [],
        preparation: "",
      };

      let section = "";

      for (const line of lines) {
        const nombreMatch = line.match(/^nombre\s*:\s*(.+)$/i);
        if (nombreMatch) {
          recipe.name = nombreMatch[1].trim();
          section = "";
          continue;
        }

        const categoriaMatch = line.match(/^categor[ií]a\s*:\s*(.+)$/i);
        if (categoriaMatch) {
          recipe.category = normalizeCategory(categoriaMatch[1]);
          section = "";
          continue;
        }

        const tiempoMatch = line.match(/^tiempo(?:\s*\(?.*?\)?)?\s*:\s*(.+)$/i);
        if (tiempoMatch) {
          const minutes = Number(String(tiempoMatch[1]).match(/\d+/)?.[0]);
          recipe.time = Number.isFinite(minutes) ? minutes : null;
          section = "";
          continue;
        }

        const ingredientesMatch = line.match(/^ingredientes?\s*:\s*(.*)$/i);
        if (ingredientesMatch) {
          section = "ingredients";
          if (ingredientesMatch[1]) {
            const parsedIngredient = parseIngredientLine(ingredientesMatch[1]);
            if (parsedIngredient) recipe.ingredients.push(parsedIngredient);
          }
          continue;
        }

        const preparacionMatch = line.match(/^preparaci[oó]n\s*:\s*(.*)$/i);
        if (preparacionMatch) {
          section = "preparation";
          if (preparacionMatch[1]) {
            recipe.preparation = preparacionMatch[1].trim();
          }
          continue;
        }

        if (section === "ingredients") {
          const parsedIngredient = parseIngredientLine(line);
          if (parsedIngredient) recipe.ingredients.push(parsedIngredient);
          continue;
        }

        if (section === "preparation") {
          recipe.preparation = recipe.preparation ? `${recipe.preparation} ${line}` : line;
        }
      }

      if (!recipe.category) recipe.category = "Principal";

      if (!recipe.name || !recipe.time || !recipe.ingredients.length || !recipe.preparation) {
        return {
          error: "No se pudo interpretar la receta. Incluye Nombre, Tiempo, Ingredientes y Preparacion.",
        };
      }

      return { recipe };
    },
    async importRecipeFromText() {
      this.importError = "";
      this.importSuccess = "";
      this.apiError = "";

      const parsed = this.parseRecipeText(this.importText);
      if (parsed.error) {
        this.importError = parsed.error;
        return;
      }

      try {
        const response = await apiFetch("/api/recipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.recipe),
        });

        if (response.status === 401) {
          this.logout();
          return;
        }
        if (!response.ok) {
          throw new Error(await parseApiError(response, "No se pudo importar la receta"));
        }

        const savedRecipe = await response.json();
        this.recipes.unshift({
          ...savedRecipe,
          ingredients: this.normalizeIngredients(savedRecipe.ingredients),
        });
        this.importSuccess = "Receta importada correctamente";
        this.importText = "";
        this.currentView = "list";
      } catch (error) {
        this.importError = error.message || "No se pudo importar la receta";
      }
    },
    goBackToList() {
      this.currentView = "list";
      this.selectedRecipeId = null;
      this.isEditing = false;
      this.apiError = "";
      this.editForm = emptyEditForm();
    },
    startEdit() {
      if (!this.selectedRecipe) return;
      this.apiError = "";
      this.isEditing = true;
      this.editForm = {
        name: this.selectedRecipe.name,
        category: this.selectedRecipe.category,
        time: this.selectedRecipe.time,
        ingredients: this.normalizeIngredients(this.selectedRecipe.ingredients),
        preparation: this.selectedRecipe.preparation,
      };
      if (!this.editForm.ingredients.length) {
        this.editForm.ingredients = [{ name: "", amount: "" }];
      }
    },
    cancelEdit() {
      this.isEditing = false;
      this.editForm = emptyEditForm();
    },
    addEditIngredient() {
      this.editForm.ingredients.push({ name: "", amount: "" });
    },
    removeEditIngredient(index) {
      if (this.editForm.ingredients.length === 1) return;
      this.editForm.ingredients.splice(index, 1);
    },
    async saveRecipe() {
      if (!this.selectedRecipe) return;

      this.apiError = "";
      const normalizedIngredients = this.normalizeIngredients(this.editForm.ingredients);

      if (
        !this.editForm.name ||
        !this.editForm.category ||
        !this.editForm.time ||
        !normalizedIngredients.length ||
        !this.editForm.preparation
      ) {
        this.apiError = "Completa todos los campos para editar la receta";
        return;
      }

      try {
        const response = await apiFetch(`/api/recipes/${this.selectedRecipe.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...this.editForm,
            ingredients: normalizedIngredients,
          }),
        });

        if (response.status === 401) {
          this.logout();
          return;
        }
        if (!response.ok) {
          throw new Error(await parseApiError(response, "No se pudo actualizar la receta"));
        }

        const updatedRecipe = await response.json();
        this.recipes = this.recipes.map((recipe) =>
          recipe.id === this.selectedRecipe.id
            ? { ...updatedRecipe, ingredients: this.normalizeIngredients(updatedRecipe.ingredients) }
            : recipe,
        );
        this.isEditing = false;
      } catch (error) {
        this.apiError = error.message || "No se pudo actualizar la receta";
      }
    },
    async removeRecipe() {
      if (!this.selectedRecipe) return;

      try {
        const response = await apiFetch(`/api/recipes/${this.selectedRecipe.id}`, {
          method: "DELETE",
        });

        if (response.status === 401) {
          this.logout();
          return;
        }
        if (!response.ok) {
          throw new Error(await parseApiError(response, "No se pudo eliminar la receta"));
        }

        this.recipes = this.recipes.filter((recipe) => recipe.id !== this.selectedRecipe.id);
        this.goBackToList();
      } catch (error) {
        this.apiError = error.message || "No se pudo eliminar la receta";
      }
    },
  },
};
</script>
