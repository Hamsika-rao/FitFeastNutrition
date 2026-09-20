// --------------------------------------------------
// MESSAGE HELPER
// --------------------------------------------------

function clearMessageAfterDelay(element) {

    setTimeout(() => {

        element.textContent = "";
        element.className = "progress-message";

    }, 3000);

}


// --------------------------------------------------
// USER CHECK
// --------------------------------------------------

const userData =
    localStorage.getItem("user");

if (!userData) {

    window.location.href =
        "/login.html";

} else {

    const user =
        JSON.parse(userData);

    document.getElementById(
        "welcomeMessage"
    ).textContent =
        `Welcome, ${user.name}!`;

    loadProfile(user.id);

    loadMeals();

    loadTodayMeals(user.id);
}


// --------------------------------------------------
// PROFILE
// --------------------------------------------------

async function loadProfile(userId) {

    try {

        document.getElementById("name").textContent =
            "Loading...";

        document.getElementById("email").textContent =
            "Loading...";

        document.getElementById("age").textContent =
            "Loading...";

        document.getElementById("height").textContent =
            "Loading...";

        document.getElementById("weight").textContent =
            "Loading...";

        document.getElementById("bmi").textContent =
            "Loading...";

        document.getElementById("bmiStatus").textContent =
            "Loading...";

        document.getElementById("goal").textContent =
            "Loading...";

        document.getElementById("calories").textContent =
            "Loading...";


        const token =
            localStorage.getItem("token");


        const response =
            await fetch(
                `/api/profile/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const profile =
            await response.json();


        if (!response.ok) {

            console.error(
                profile.message
            );

            document.getElementById("name").textContent =
                "Unavailable";

            document.getElementById("email").textContent =
                "Unavailable";

            document.getElementById("age").textContent =
                "Unavailable";

            document.getElementById("height").textContent =
                "Unavailable";

            document.getElementById("weight").textContent =
                "Unavailable";

            document.getElementById("bmi").textContent =
                "Unavailable";

            document.getElementById("bmiStatus").textContent =
                "Unavailable";

            document.getElementById("goal").textContent =
                "Unavailable";

            document.getElementById("calories").textContent =
                "Unavailable";

            return;
        }


        document.getElementById("name").textContent =
            profile.name;

        document.getElementById("email").textContent =
            profile.email;

        document.getElementById("age").textContent =
            profile.age;

        document.getElementById("height").textContent =
            profile.height_cm;

        document.getElementById("weight").textContent =
            profile.weight_kg;

        document.getElementById("bmi").textContent =
            profile.bmi ?? "Not calculated";

        document.getElementById("bmiStatus").textContent =
            profile.bmi_status ?? "Not available";

        document.getElementById("goal").textContent =
            profile.goal ?? "Not available";

        document.getElementById("calories").textContent =
            profile.calorie_target ?? "Not calculated";


    } catch (error) {

        console.error(
            "Error loading profile:",
            error
        );

        document.getElementById("name").textContent =
            "Unavailable";

        document.getElementById("email").textContent =
            "Unavailable";

        document.getElementById("age").textContent =
            "Unavailable";

        document.getElementById("height").textContent =
            "Unavailable";

        document.getElementById("weight").textContent =
            "Unavailable";

        document.getElementById("bmi").textContent =
            "Unavailable";

        document.getElementById("bmiStatus").textContent =
            "Unavailable";

        document.getElementById("goal").textContent =
            "Unavailable";

        document.getElementById("calories").textContent =
            "Unavailable";
    }
}


// --------------------------------------------------
// AVAILABLE MEALS
// --------------------------------------------------

async function loadMeals() {

    try {

        const container =
            document.getElementById(
                "mealsContainer"
            );

        const mealSelect =
            document.getElementById(
                "mealSelect"
            );


        container.innerHTML =
            "<p>Loading meals...</p>";


        const response =
            await fetch("/api/meals");


        const meals =
            await response.json();


        if (!response.ok) {

            console.error(
                meals.message
            );

            container.innerHTML =
                "<p>Failed to load meals. Please try again.</p>";

            return;
        }


        if (meals.length === 0) {

            container.innerHTML =
                "<p>No meals are currently available.</p>";

            mealSelect.innerHTML =
                '<option value="">No meals available</option>';

            mealSelect.disabled =
                true;

            return;
        }


        container.innerHTML =
            "";


        mealSelect.innerHTML =
            '<option value="">Select a meal</option>';


        // --------------------------------------------------
        // DISPLAY MEAL CARDS
        // --------------------------------------------------

        meals.forEach((meal) => {

            const mealElement =
                document.createElement("div");


            mealElement.innerHTML = `
                <h4>${meal.name}</h4>

                <p>Category: ${meal.category}</p>

                <p>Calories: ${meal.calories}</p>

                <p>Protein: ${meal.protein_g} g</p>

                <p>Carbs: ${meal.carbs_g} g</p>

                <p>Fat: ${meal.fat_g} g</p>

                <hr>
            `;


            container.appendChild(
                mealElement
            );

        });


        // --------------------------------------------------
        // GROUP MEALS BY CATEGORY
        // --------------------------------------------------

        const categories = {};


        meals.forEach((meal) => {

            if (!categories[meal.category]) {

                categories[meal.category] = [];

            }

            categories[meal.category].push(
                meal
            );

        });


        // --------------------------------------------------
        // CREATE GROUPED DROPDOWN
        // --------------------------------------------------

        Object.keys(categories).forEach(
            (category) => {

                const group =
                    document.createElement(
                        "optgroup"
                    );

                group.label =
                    category;


                categories[category].forEach(
                    (meal) => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            meal.id;

                        option.textContent =
                            `${meal.name} - ${meal.calories} calories`;

                        option.dataset.category =
                            meal.category;

                        option.dataset.calories =
                            meal.calories;


                        group.appendChild(
                            option
                        );

                    }
                );


                mealSelect.appendChild(
                    group
                );

            }
        );


    } catch (error) {

        console.error(
            "Error loading meals:",
            error
        );

        document.getElementById(
            "mealsContainer"
        ).innerHTML =
            "<p>Something went wrong while loading meals.</p>";
    }
}


// --------------------------------------------------
// MEAL FORM ELEMENTS
// --------------------------------------------------

const mealSelect =
    document.getElementById(
        "mealSelect"
    );

const mealType =
    document.getElementById(
        "mealType"
    );

const quantityInput =
    document.getElementById(
        "quantity"
    );

const caloriePreview =
    document.getElementById(
        "caloriePreview"
    );


// --------------------------------------------------
// AUTO SELECT MEAL TYPE
// --------------------------------------------------

mealSelect.addEventListener(
    "change",
    () => {

        const selectedOption =
            mealSelect.options[
                mealSelect.selectedIndex
            ];


        const category =
            selectedOption.dataset.category;


        if (category) {

            mealType.value =
                category;

            mealType.disabled =
                false;

        } else {

            mealType.value =
                "";

            mealType.disabled =
                true;
        }


        updateCaloriePreview();

    }
);


// --------------------------------------------------
// CALORIE PREVIEW
// --------------------------------------------------

function updateCaloriePreview() {

    const selectedOption =
        mealSelect.options[
            mealSelect.selectedIndex
        ];


    const mealCalories =
        Number(
            selectedOption.dataset.calories
        ) || 0;


    const quantity =
        Number(
            quantityInput.value
        ) || 0;


    const totalCalories =
        mealCalories * quantity;


    caloriePreview.textContent =
        `Total Calories: ${totalCalories}`;
}


quantityInput.addEventListener(
    "input",
    updateCaloriePreview
);


// --------------------------------------------------
// TODAY'S MEALS
// --------------------------------------------------

async function loadTodayMeals(userId) {

    try {

        const container =
            document.getElementById(
                "todayMeals"
            );


        container.innerHTML =
            "<p>Loading today's meals...</p>";


        const token =
            localStorage.getItem("token");


        const response =
            await fetch(
                `/api/meal-logs/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const meals =
            await response.json();


        if (!response.ok) {

            console.error(
                meals.message
            );

            container.innerHTML =
                "<p>Failed to load today's meals.</p>";

            return;
        }


        container.innerHTML =
            "";


        let totalCalories = 0;


        // --------------------------------------------------
        // EMPTY STATE
        // --------------------------------------------------

        if (meals.length === 0) {

            container.innerHTML =
                "<p>No meals logged today. Start by logging your first meal above.</p>";
        }


        // --------------------------------------------------
        // DISPLAY TODAY'S MEALS
        // --------------------------------------------------

        meals.forEach((meal) => {

            const calories =
                Number(meal.calories) *
                Number(meal.quantity);


            totalCalories +=
                calories;


            const mealElement =
                document.createElement(
                    "div"
                );


            mealElement.className =
                "meal-card";


            mealElement.innerHTML = `
                <h4>${meal.name}</h4>

                <p>Type: ${meal.meal_type}</p>

                <p>Quantity: ${meal.quantity}</p>

                <p>Calories: ${calories}</p>

                <button onclick="deleteMeal(${meal.id})">
                    Delete
                </button>
            `;


            container.appendChild(
                mealElement
            );

        });


        // --------------------------------------------------
        // CALORIE SUMMARY
        // --------------------------------------------------

        document.getElementById(
            "caloriesConsumed"
        ).textContent =
            totalCalories;


        const profileToken =
            localStorage.getItem("token");


        const profileResponse =
            await fetch(
                `/api/profile/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${profileToken}`
                    }
                }
            );


        const profile =
            await profileResponse.json();


        const target =
            Number(
                profile.calorie_target
            ) || 0;


        document.getElementById(
            "dailyTarget"
        ).textContent =
            target;


        const remaining =
            target - totalCalories;


        const remainingElement =
            document.getElementById(
                "caloriesRemaining"
            );


        if (remaining >= 0) {

            remainingElement.textContent =
                remaining;

        } else {

            remainingElement.textContent =
                "Exceeded by " +
                Math.abs(remaining);
        }


        let percentage = 0;


        if (target > 0) {

            percentage =
                (totalCalories / target) *
                100;
        }


        document.getElementById(
            "caloriePercentage"
        ).textContent =
            percentage.toFixed(0) + "%";


        const progressFill =
            document.getElementById(
                "calorieProgressFill"
            );


        const barPercentage =
            Math.min(
                percentage,
                100
            );


        progressFill.style.width =
            barPercentage + "%";


    } catch (error) {

        console.error(
            "Error loading today's meals:",
            error
        );

        document.getElementById(
            "todayMeals"
        ).innerHTML =
            "<p>Something went wrong while loading today's meals.</p>";
    }
}


// --------------------------------------------------
// DELETE MEAL
// --------------------------------------------------

async function deleteMeal(logId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this meal?"
        );


    if (!confirmed) {
        return;
    }


    const button =
        document.querySelector(
            `button[onclick="deleteMeal(${logId})"]`
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Deleting...";
    }


    try {

        const token =
            localStorage.getItem("token");


        const response =
            await fetch(
                `/api/meal-logs/${logId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const result =
            await response.json();


        const message =
            document.getElementById(
                "deleteMealMessage"
            );


        message.textContent =
            result.message;


        if (response.ok) {

            message.className =
                "progress-message success";


            clearMessageAfterDelay(
                message
            );


            const user =
                JSON.parse(
                    localStorage.getItem("user")
                );


            loadTodayMeals(
                user.id
            );


        } else {

            message.className =
                "progress-message error";


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Delete";
            }
        }


    } catch (error) {

        console.error(
            "Error deleting meal:",
            error
        );


        const message =
            document.getElementById(
                "deleteMealMessage"
            );


        message.textContent =
            "Something went wrong while deleting the meal.";


        message.className =
            "progress-message error";


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Delete";
        }
    }
}


// --------------------------------------------------
// LOG MEAL
// --------------------------------------------------

const mealLogForm =
    document.getElementById(
        "mealLogForm"
    );


mealLogForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const submitButton =
            mealLogForm.querySelector(
                "button[type='submit']"
            );


        submitButton.disabled =
            true;

        submitButton.textContent =
            "Logging...";


        const user =
            JSON.parse(
                localStorage.getItem("user")
            );


        const mealId =
            document.getElementById(
                "mealSelect"
            ).value;


        const selectedMealType =
            document.getElementById(
                "mealType"
            ).value;


        const quantity =
            document.getElementById(
                "quantity"
            ).value;


        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (!mealId) {

            const message =
                document.getElementById(
                    "mealLogMessage"
                );


            message.textContent =
                "Please select a meal.";

            message.className =
                "progress-message error";


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Log Meal";


            return;
        }


        if (!selectedMealType) {

            const message =
                document.getElementById(
                    "mealLogMessage"
                );


            message.textContent =
                "Please select a meal type.";

            message.className =
                "progress-message error";


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Log Meal";


            return;
        }


        if (!quantity || Number(quantity) <= 0) {

            const message =
                document.getElementById(
                    "mealLogMessage"
                );


            message.textContent =
                "Please enter a valid quantity.";

            message.className =
                "progress-message error";


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Log Meal";


            return;
        }


        try {

            const token =
                localStorage.getItem("token");


            const response =
                await fetch(
                    "/api/meal-logs",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({

                                mealId:
                                    mealId,

                                mealType:
                                    selectedMealType,

                                quantity:
                                    quantity
                            })
                    }
                );


            const result =
                await response.json();


            const message =
                document.getElementById(
                    "mealLogMessage"
                );


            message.textContent =
                result.message;


            if (response.ok) {

                message.className =
                    "progress-message success";


                mealLogForm.reset();


                mealType.value =
                    "";

                mealType.disabled =
                    true;


                updateCaloriePreview();


                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Log Meal";


                loadTodayMeals(
                    user.id
                );


                clearMessageAfterDelay(
                    message
                );


            } else {

                message.className =
                    "progress-message error";


                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Log Meal";
            }


        } catch (error) {

            console.error(
                "Error logging meal:",
                error
            );


            const message =
                document.getElementById(
                    "mealLogMessage"
                );


            message.textContent =
                "Something went wrong while logging the meal.";


            message.className =
                "progress-message error";


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Log Meal";
        }

    }
);


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


logoutButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "token"
        );


        window.location.href =
            "/login.html";

    }
);