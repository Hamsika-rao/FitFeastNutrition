const userData =
    localStorage.getItem("user");

const token =
    localStorage.getItem("token");


if (!userData || !token) {

    window.location.href =
        "/login.html";

} else {

    const user =
        JSON.parse(userData);

    loadMealPlan(user.id);
}


// LOAD MEAL PLAN

async function loadMealPlan(userId) {

    try {

        const response =
            await fetch(
                `/api/meal-plan/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const plan =
            await response.json();


        if (!response.ok) {

            console.error(
                plan.message
            );

            return;
        }


        // DISPLAY GOAL

        document.getElementById(
            "goal"
        ).textContent =
            plan.goal;


        // DISPLAY CALORIE TARGET

        document.getElementById(
            "calorieTarget"
        ).textContent =
            plan.calorieTarget +
            " calories";


        // DISPLAY MEALS

        displayMeals(
            "breakfast",
            plan.breakfast
        );

        displayMeals(
            "lunch",
            plan.lunch
        );

        displayMeals(
            "snack",
            plan.snack
        );

        displayMeals(
            "dinner",
            plan.dinner
        );


    } catch (error) {

        console.error(
            "Error loading meal plan:",
            error
        );
    }
}


// DISPLAY MEALS

function displayMeals(
    elementId,
    meals
) {

    const container =
        document.getElementById(
            elementId
        );


    if (
        !meals ||
        meals.length === 0
    ) {

        container.innerHTML =
            "<p>No meals available.</p>";

        return;
    }


    container.innerHTML =
        "";


    meals.forEach(
        (meal, index) => {

            const mealElement =
                document.createElement(
                    "div"
                );


            mealElement.innerHTML = `
                <h4>
                    Option ${index + 1}: ${meal.name}
                </h4>

                <p>
                    Recommended Quantity:
                    ${meal.recommendedQuantity}
                </p>

                <p>
                    Calories: ${meal.calories}
                </p>

                <p>
                    Protein: ${meal.protein_g} g
                </p>

                <p>
                    Carbs: ${meal.carbs_g} g
                </p>

                <p>
                    Fat: ${meal.fat_g} g
                </p>

                <hr>
            `;


            container.appendChild(
                mealElement
            );

        }
    );
}