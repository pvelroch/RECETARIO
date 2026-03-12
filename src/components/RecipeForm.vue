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

      <div class="ingredients-block">
        <span>Ingredientes</span>
        <div class="ingredient-row" v-for="(ingredient, index) in form.ingredients" :key="index">
          <input
            v-model.trim="ingredient.name"
            type="text"
            placeholder="Ingrediente"
            required
          />
          <input
            v-model.trim="ingredient.amount"
            type="text"
            placeholder="Cantidad (ej. 200 g)"
            required
          />
          <button
            type="button"
            class="danger"
            @click="removeIngredient(index)"
            :disabled="form.ingredients.length === 1"
          >
            Quitar
          </button>
        </div>
        <button type="button" class="secondary" @click="addIngredient">Agregar ingrediente</button>
      </div>

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
        ingredients: [
          {
            name: "",
            amount: "",
          },
        ],
        preparation: "",
      },
    };
  },
  methods: {
    addIngredient() {
      this.form.ingredients.push({ name: "", amount: "" });
    },
    removeIngredient(index) {
      if (this.form.ingredients.length === 1) return;
      this.form.ingredients.splice(index, 1);
    },
    submit() {
      this.$emit("submit", { ...this.form });
    },
  },
};
</script>
