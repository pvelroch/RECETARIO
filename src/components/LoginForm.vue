<template>
  <div>
    <h1>{{ mode === "login" ? "Iniciar sesion" : "Crear cuenta" }}</h1>
    <p class="muted">
      {{ mode === "login" ? "Accede para gestionar recetas" : "Registra un usuario nuevo" }}
    </p>

    <div class="auth-switch">
      <button
        type="button"
        class="ghost"
        :class="{ active: mode === 'login' }"
        @click="$emit('set-mode', 'login')"
      >
        Entrar
      </button>
      <button
        type="button"
        class="ghost"
        :class="{ active: mode === 'register' }"
        @click="$emit('set-mode', 'register')"
      >
        Crear cuenta
      </button>
    </div>

    <form @submit.prevent="submit" class="stack">
      <label>
        Usuario
        <input v-model.trim="username" type="text" required minlength="3" autocomplete="username" />
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

      <label v-if="mode === 'register'">
        Confirmar contrasena
        <input
          v-model="confirmPassword"
          type="password"
          required
          minlength="4"
          autocomplete="new-password"
        />
      </label>

      <button type="submit">{{ mode === "login" ? "Entrar" : "Crear usuario" }}</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="mode === 'login'" class="hint">
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
    mode: {
      type: String,
      default: "login",
    },
  },
  data() {
    return {
      username: "",
      password: "",
      confirmPassword: "",
    };
  },
  methods: {
    submit() {
      if (this.mode === "register" && this.password !== this.confirmPassword) {
        this.$emit("submit", {
          username: this.username,
          password: this.password,
          confirmPassword: this.confirmPassword,
          clientError: "Las contrasenas no coinciden",
        });
        return;
      }

      this.$emit("submit", {
        username: this.username,
        password: this.password,
        confirmPassword: this.confirmPassword,
      });
    },
  },
};
</script>
