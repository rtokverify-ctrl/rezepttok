// Portion Calculator
// Purpose: Adjust ingredient quantities based on serving size.

export const scaleIngredients = (ingredients, originalServings, targetServings) => {
    // TODO: Implement math to scale ingredients
    // Example: (amount / original) * target
    return ingredients.map(ing => {
        return {
            ...ing,
            // calculatedAmount: ...
        };
    });
};
