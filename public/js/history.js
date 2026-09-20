const userData =
    localStorage.getItem("user");

if (!userData) {

    window.location.href =
        "/login.html";

} else {

    const user =
        JSON.parse(userData);

    loadMealHistory(user.id);
}


async function loadMealHistory(userId) {

    const container =
        document.getElementById(
            "historyContainer"
        );


    container.innerHTML =
        "<p>Loading meal history...</p>";


    try {

        const token =
            localStorage.getItem("token");


        const response =
            await fetch(
                `/api/meal-history/${userId}`,
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
                "<p>Failed to load meal history.</p>";

            return;
        }


        container.innerHTML =
            "";


        let totalCalories = 0;


        if (meals.length === 0) {

            container.innerHTML =
                "<p>No meal history found.</p>";

            document.getElementById(
                "totalCalories"
            ).textContent = 0;

            return;
        }


        meals.forEach((meal) => {

            const mealElement =
                document.createElement(
                    "div"
                );


            const calories =
                Number(meal.calories) *
                Number(meal.quantity);


            totalCalories +=
                calories;


            const date =
                new Date(
                    meal.logged_at
                );


            mealElement.className =
                "history-card";


            mealElement.innerHTML = `
                <h4>${meal.name}</h4>

                <div class="history-details">
                    <p><strong>Type:</strong> ${meal.meal_type}</p>
                    <p><strong>Quantity:</strong> ${meal.quantity}</p>
                    <p><strong>Calories:</strong> ${calories}</p>
                    <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${date.toLocaleTimeString()}</p>
                </div>
            `;


            container.appendChild(
                mealElement
            );

        });


        document.getElementById(
            "totalCalories"
        ).textContent =
            totalCalories;


    } catch (error) {

        console.error(
            "Error loading meal history:",
            error
        );

        container.innerHTML =
            "<p>Something went wrong while loading meal history.</p>";
    }
}