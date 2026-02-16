<template>
  <main class="app-shell">
    <section v-if="!isAuthenticated" class="card auth-card">
      <LoginForm
        :error="authError"
        :mode="authMode"
        demo-user="admin"
        demo-password="1234"
        @set-mode="setAuthMode"
        @submit="submitAuth"∫
      />
    </section>

    <section v-else class="card panel-card">
      <header class="panel-header">
        <div>
          <h1>Alta de recetas</h1>
          <p class="muted">Bienvenido 2, {{ currentUser }}</p>
        </div>
        <button class="secondary" @click="logout">Cerrar sesion</button>
      </header>

      <RecipeForm :error="formError" @submit="addRecipe" />
      <p v-if="apiError" class="error">{{ apiError }}</p>

      <section class="recipes" v-if="recipes.length">
        <h2>Recetas guardadas</h2>
        <article class="recipe-item" v-for="recipe in recipes" :key="recipe.id">
          <template v-if="editingRecipeId === recipe.id">
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
                <div
                  class="ingredient-row"
                  v-for="(ingredient, index) in editForm.ingredients"
                  :key="`edit-${recipe.id}-${index}`"
                >
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
                <textarea v-model.trim="editForm.preparation" rows="5"></textarea>
              </label>
            </div>

            <div class="recipe-actions">
              <button @click="saveRecipe(recipe.id)">Guardar</button>
              <button class="secondary" @click="cancelEdit">Cancelar</button>
              <button class="danger" @click="removeRecipe(recipe.id)">Eliminar</button>
            </div>
          </template>

          <template v-else>
            <div class="recipe-top">
              <h3>{{ recipe.name }}</h3>
              <div class="recipe-actions">
                <button class="secondary" @click="startEdit(recipe)">Editar</button>
                <button class="danger" @click="removeRecipe(recipe.id)">Eliminar</button>
              </div>
            </div>
            <p>
              <strong>Categoria:</strong> {{ recipe.category }} |
              <strong>Tiempo:</strong> {{ recipe.time }} min
            </p>
            <div>
              <strong>Ingredientes:</strong>
              <ul class="ingredients-list">
                <li v-for="(ingredient, index) in recipe.ingredients" :key="`show-${recipe.id}-${index}`">
                  {{ ingredient.name }} - {{ ingredient.amount }}
                </li>
              </ul>
            </div>
            <p><strong>Preparacion:</strong> {{ recipe.preparation }}</p>
          </template>
        </article>
      </section>

      <p v-else class="muted empty">Aun no hay recetas registradas.</p>
    </section>
  </main>
</template>

<script>
import LoginForm from "./components/LoginForm.vue";
import RecipeForm from "./components/RecipeForm.vue";

const API_BASE = (process.env.VUE_APP_API_URL || "").replace(/\/+$/, "");

function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
}

export default {
  name: "App",
  components: {
    LoginForm,
    RecipeForm,
  },
  data() {
    return {
      isAuthenticated: false,
      currentUser: "",
      authMode: "login",
      authError: "",
      formError: "",
      apiError: "",
      recipes: [],
      editingRecipeId: null,
      editForm: {
        name: "",
        category: "",
        time: null,
        ingredients: [{ name: "", amount: "" }],
        preparation: "",
      },
    };
  },
  created() {
    this.restoreSession();
  },
  methods: {
    handleUnauthorized() {
      this.isAuthenticated = false;
      this.currentUser = "";
      this.recipes = [];
      this.editingRecipeId = null;
      this.authError = "Sesion expirada. Inicia sesion de nuevo.";
    },
    setAuthMode(mode) {
      this.authMode = mode;
      this.authError = "";
    },
    async restoreSession() {
      this.authError = "";
      try {
        const response = await apiFetch("/api/session");
        if (!response.ok) return;

        const data = await response.json();
        this.isAuthenticated = true;
        this.currentUser = data.username;
        await this.fetchRecipes();
      } catch (_error) {
        this.authError = "";
      }
    },
    async fetchRecipes() {
      this.apiError = "";
      try {
        const response = await apiFetch("/api/recipes");
        if (response.status === 401) {
          this.handleUnauthorized();
          return;
        }
        if (!response.ok) throw new Error("load_failed");
        const rawRecipes = await response.json();
        this.recipes = rawRecipes.map((recipe) => ({
          ...recipe,
          ingredients: this.normalizeIngredients(recipe.ingredients),
        }));
      } catch (_error) {
        this.apiError = "No se pudieron cargar las recetas del servidor";
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
    addEditIngredient() {
      this.editForm.ingredients.push({ name: "", amount: "" });
    },
    removeEditIngredient(index) {
      if (this.editForm.ingredients.length === 1) return;
      this.editForm.ingredients.splice(index, 1);
    },
    async submitAuth(credentials) {
      this.authError = "";
      if (credentials.clientError) {
        this.authError = credentials.clientError;
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
            username: credentials.username,
            password: credentials.password,
          }),
        });

        if (response.status === 401) {
          this.authError = "Credenciales incorrectas";
          return;
        }
        if (response.status === 409) {
          this.authError = "El usuario ya existe";
          return;
        }
        if (response.status === 400) {
          this.authError = "Usuario o contrasena no validos";
          return;
        }

        if (!response.ok) throw new Error("login_failed");

        const data = await response.json();
        this.isAuthenticated = true;
        this.currentUser = data.username;
        await this.fetchRecipes();
      } catch (_error) {
        this.authError = "No se pudo iniciar sesion";
      }
    },
    async logout() {
      try {
        await apiFetch("/api/logout", {
          method: "POST",
        });
      } catch (_error) {
        // no-op: limpiar estado local igualmente
      }

      this.isAuthenticated = false;
      this.currentUser = "";
      this.recipes = [];
      this.editingRecipeId = null;
      this.formError = "";
      this.apiError = "";
      this.authError = "";
    },
    startEdit(recipe) {
      this.apiError = "";
      this.editingRecipeId = recipe.id;
      this.editForm = {
        name: recipe.name,
        category: recipe.category,
        time: recipe.time,
        ingredients: this.normalizeIngredients(recipe.ingredients),
        preparation: recipe.preparation,
      };
      if (!this.editForm.ingredients.length) {
        this.editForm.ingredients = [{ name: "", amount: "" }];
      }
    },
    cancelEdit() {
      this.editingRecipeId = null;
      this.editForm = {
        name: "",
        category: "",
        time: null,
        ingredients: [{ name: "", amount: "" }],
        preparation: "",
      };
    },
    async saveRecipe(id) {
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
        const response = await apiFetch(`/api/recipes/${id}`, {
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
          this.handleUnauthorized();
          return;
        }

        if (!response.ok) throw new Error("update_failed");
        const updatedRecipe = await response.json();
        this.recipes = this.recipes.map((recipe) =>
          recipe.id === id
            ? { ...updatedRecipe, ingredients: this.normalizeIngredients(updatedRecipe.ingredients) }
            : recipe,
        );
        this.cancelEdit();
      } catch (_error) {
        this.apiError = "No se pudo actualizar la receta";
      }
    },
    async addRecipe(recipeInput) {
      this.formError = "";
      const normalizedIngredients = this.normalizeIngredients(recipeInput.ingredients);

      if (
        !recipeInput.name ||
        !recipeInput.category ||
        !recipeInput.time ||
        !normalizedIngredients.length ||
        !recipeInput.preparation
      ) {
        this.formError = "Completa los campos obligatorios";
        return;
      }

      try {
        const response = await apiFetch("/api/recipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...recipeInput,
            ingredients: normalizedIngredients,
          }),
        });

        if (response.status === 401) {
          this.handleUnauthorized();
          return;
        }

        if (!response.ok) throw new Error("create_failed");
        const recipe = await response.json();
        recipe.ingredients = this.normalizeIngredients(recipe.ingredients);
        this.recipes.unshift(recipe);
      } catch (_error) {
        this.formError = "No se pudo guardar la receta";
      }
    },
    async removeRecipe(id) {
      try {
        const response = await apiFetch(`/api/recipes/${id}`, {
          method: "DELETE",
        });

        if (response.status === 401) {
          this.handleUnauthorized();
          return;
        }

        if (!response.ok) throw new Error("delete_failed");
        this.recipes = this.recipes.filter((recipe) => recipe.id !== id);
        if (this.editingRecipeId === id) {
          this.cancelEdit();
        }
      } catch (_error) {
        this.apiError = "No se pudo eliminar la receta";
      }
    },
  },
};
</script>
