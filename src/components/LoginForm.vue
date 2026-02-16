<template>
  <div>
    <h1>Iniciar sesion</h1>
    <p class="muted">Accede para gestionar recetas</p>

    <form @submit.prevent="submit" class="stack">
      <label>
        Usuario
        <input v-model.trim="username" type="text" required autocomplete="username" />
      </label>

      <label>
        Contrasena
        <input
          v-model="password"
          type="password"
          required
          minlength="4"
          autocomplete="current-password"
        />
      </label>

      <button type="submit">Entrar</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p class="hint">
      Demo: usuario <strong>{{ demoUser }}</strong> y contrasena <strong>{{ demoPassword }}</strong>
    </p>
  </div>
</template>

<script>
export default {
  name: "LoginForm",
  props: {
    error: {
      type: String,
      default: "",
    },
    demoUser: {
      type: String,
      default: "",
    },
    demoPassword: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    submit() {
      this.$emit("submit", {
        username: this.username,
        password: this.password,
      });
    },
  },
};
</script>
