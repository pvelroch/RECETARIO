<template>
  <main class="app-shell">
    <section v-if="!isAuthenticated" class="card auth-card">
      <LoginForm
        :error="authError"
        :demo-user="validCredentials.username"
        :demo-password="validCredentials.password"
        @submit="login"
      />
    </section>

    <section v-else class="card panel-card">
      <header class="panel-header">
        <div>
          <h1>Alta de recetas</h1>
          <p class="muted">Bienvenido, {{ currentUser }}</p>
        </div>
        <button class="secondary" @click="logout">Cerrar sesion</button>
      </header>

      <RecipeForm :error="formError" @submit="addRecipe" />

      <section class="recipes" v-if="recipes.length">
        <h2>Recetas guardadas</h2>
        <article class="recipe-item" v-for="recipe in recipes" :key="recipe.id">
          <div class="recipe-top">
            <h3>{{ recipe.name }}</h3>
            <button class="danger" @click="removeRecipe(recipe.id)">Eliminar</button>
          </div>
          <p>
            <strong>Categoria:</strong> {{ recipe.category }} |
            <strong>Tiempo:</strong> {{ recipe.time }} min
          </p>
          <p><strong>Ingredientes:</strong> {{ recipe.ingredients }}</p>
          <p><strong>Preparacion:</strong> {{ recipe.preparation }}</p>
        </article>
      </section>

      <p v-else class="muted empty">Aun no hay recetas registradas.</p>
    </section>
  </main>
</template>

<script>
import LoginForm from "./components/LoginForm.vue";
import RecipeForm from "./components/RecipeForm.vue";

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
      authError: "",
      formError: "",
      recipes: [],
      validCredentials: {
        username: "admin",
        password: "1234",
      },
    };
  },
  created() {
    const savedUser = localStorage.getItem("currentUser");
    const savedRecipes = localStorage.getItem("recipes");

    if (savedUser) {
      this.isAuthenticated = true;
      this.currentUser = savedUser;
    }

    if (savedRecipes) {
      this.recipes = JSON.parse(savedRecipes);
    }
  },
  methods: {
    login(credentials) {
      this.authError = "";

      const okUser = credentials.username === this.validCredentials.username;
      const okPass = credentials.password === this.validCredentials.password;

      if (!okUser || !okPass) {
        this.authError = "Credenciales incorrectas";
        return;
      }

      this.isAuthenticated = true;
      this.currentUser = credentials.username;
      localStorage.setItem("currentUser", this.currentUser);
    },
    logout() {
      this.isAuthenticated = false;
      this.currentUser = "";
      localStorage.removeItem("currentUser");
    },
    addRecipe(recipeInput) {
      this.formError = "";

      if (!recipeInput.name || !recipeInput.category || !recipeInput.time) {
        this.formError = "Completa los campos obligatorios";
        return;
      }

      const recipe = {
        id: Date.now(),
        ...recipeInput,
      };

      this.recipes.unshift(recipe);
      localStorage.setItem("recipes", JSON.stringify(this.recipes));
    },
    removeRecipe(id) {
      this.recipes = this.recipes.filter((recipe) => recipe.id !== id);
      localStorage.setItem("recipes", JSON.stringify(this.recipes));
    },
  },
};
</script>
