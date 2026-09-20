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

    loadCalorieReport(user.id);

    loadNutritionReport(user.id);
}


// --------------------------------------------------
// CALORIE REPORT
// --------------------------------------------------

async function loadCalorieReport(userId) {

    try {

        const response =
            await fetch(
                `/api/reports/calories/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const report =
            await response.json();


        if (!response.ok) {

            console.error(
                report.message
            );

            return;
        }


        // Get the 7-day data
        const data =
            report.data;


        // Get user's daily calorie target
        const calorieTarget =
            report.calorieTarget;


        const labels =
            data.map(
                (record) => {

                    const date =
                        new Date(
                            record.date
                        );

                    return date.toLocaleDateString();
                }
            );


        const calories =
            data.map(
                (record) =>
                    Number(
                        record.total_calories
                    )
            );


        const targetCalories =
            data.map(
                () =>
                    calorieTarget
            );


        const ctx =
            document.getElementById(
                "calorieChart"
            );


        new Chart(
            ctx,
            {
                type: "bar",

                data: {
                    labels: labels,

                    datasets: [

                        {
                            label:
                                "Calories Consumed",

                            data:
                                calories,

                            borderWidth:
                                1
                        },

                        {
                            label:
                                "Daily Target",

                            data:
                                targetCalories,

                            type:
                                "line",

                            borderWidth:
                                2,

                            tension:
                                0
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            title: {
                                display:
                                    true,

                                text:
                                    "Calories"
                            }
                        },

                        x: {

                            title: {
                                display:
                                    true,

                                text:
                                    "Date"
                            }
                        }
                    }
                }
            }
        );


    } catch (error) {

        console.error(
            "Error loading calorie report:",
            error
        );
    }
}


// --------------------------------------------------
// NUTRITION REPORT
// --------------------------------------------------

async function loadNutritionReport(userId) {

    try {

        const response =
            await fetch(
                `/api/reports/nutrition/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const nutrition =
            await response.json();


        if (!response.ok) {

            console.error(
                nutrition.message
            );

            return;
        }


        const labels =
            nutrition.map(
                (record) => {

                    const date =
                        new Date(
                            record.date
                        );

                    return date.toLocaleDateString();
                }
            );


        const protein =
            nutrition.map(
                (record) =>
                    Number(
                        record.protein
                    )
            );


        const carbs =
            nutrition.map(
                (record) =>
                    Number(
                        record.carbs
                    )
            );


        const fat =
            nutrition.map(
                (record) =>
                    Number(
                        record.fat
                    )
            );


        // --------------------------------------------------
        // CALCULATE 7-DAY TOTALS
        // --------------------------------------------------

        const totalProtein =
            protein.reduce(
                (sum, value) =>
                    sum + value,
                0
            );


        const totalCarbs =
            carbs.reduce(
                (sum, value) =>
                    sum + value,
                0
            );


        const totalFat =
            fat.reduce(
                (sum, value) =>
                    sum + value,
                0
            );


        // --------------------------------------------------
        // DISPLAY TOTALS
        // --------------------------------------------------

        document.getElementById(
            "totalProtein"
        ).textContent =
            totalProtein.toFixed(2);


        document.getElementById(
            "totalCarbs"
        ).textContent =
            totalCarbs.toFixed(2);


        document.getElementById(
            "totalFat"
        ).textContent =
            totalFat.toFixed(2);


        // --------------------------------------------------
        // CREATE NUTRITION CHART
        // --------------------------------------------------

        const ctx =
            document.getElementById(
                "nutritionChart"
            );


        new Chart(
            ctx,
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [

                        {
                            label:
                                "Protein (g)",

                            data:
                                protein,

                            borderWidth:
                                2,

                            tension:
                                0.3
                        },

                        {
                            label:
                                "Carbohydrates (g)",

                            data:
                                carbs,

                            borderWidth:
                                2,

                            tension:
                                0.3
                        },

                        {
                            label:
                                "Fat (g)",

                            data:
                                fat,

                            borderWidth:
                                2,

                            tension:
                                0.3
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            title: {
                                display:
                                    true,

                                text:
                                    "Grams"
                            }
                        },

                        x: {

                            title: {
                                display:
                                    true,

                                text:
                                    "Date"
                            }
                        }
                    }
                }
            }
        );


    } catch (error) {

        console.error(
            "Error loading nutrition report:",
            error
        );
    }
}