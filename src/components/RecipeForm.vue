<template>
  <div>
    <form @submit.prevent="submit" class="recipe-form">
      <label>
        Nombre de la receta
        <input v-model.trim="form.name" type="text" required maxlength="80" />
      </label>

      <label>
        Categoria
        <select v-model="form.category" required>
          <option disabled value="">Selecciona una categoria</option>
          <option>Entrante</option>
          <option>Principal</option>
          <option>Postre</option>
          <option>Bebida</option>
        </select>
      </label>

      <label>
        Tiempo (minutos)
        <input v-model.number="form.time" type="number" min="1" max="600" required />
      </label>

      <label>
        Ingredientes
        <textarea
          v-model.trim="form.ingredients"
          rows="4"
          placeholder="Ejemplo: Harina, huevos, leche"
          required
        ></textarea>
      </label>

      <label>
        Preparacion
        <textarea
          v-model.trim="form.preparation"
          rows="5"
          placeholder="Describe los pasos"
          required
        ></textarea>
      </label>

      <button type="submit">Guardar receta</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
export default {
  name: "RecipeForm",
  props: {
    error: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      form: {
        name: "",
        category: "",
        time: null,
        ingredients: "",
        preparation: "",
      },
    };
  },
  methods: {
    submit() {
      this.$emit("submit", { ...this.form });
      this.form = {
        name: "",
        category: "",
        time: null,
        ingredients: "",
        preparation: "",
      };
    },
  },
};
</script>
