const userData =
    localStorage.getItem("user");

let weightChart = null;
let bmiChart = null;


if (!userData) {

    window.location.href =
        "/login.html";

} else {

    const user =
        JSON.parse(userData);

    loadProgress(user.id);
}


// --------------------------------------------------
// LOAD PROGRESS
// --------------------------------------------------

async function loadProgress(userId) {

    try {

        const token =
            localStorage.getItem("token");


        const response =
            await fetch(
                `/api/progress/${userId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const progress =
            await response.json();


        if (!response.ok) {

            console.error(
                progress.message
            );

            return;
        }


        const container =
            document.getElementById(
                "progressContainer"
            );


        container.innerHTML =
            "";


        // --------------------------------------------------
        // DISPLAY PROGRESS HISTORY
        // --------------------------------------------------

        if (progress.length === 0) {

            container.innerHTML =
                "<p>No progress records found. Record your weight above.</p>";

        } else {

            progress.forEach((record) => {

                const progressElement =
                    document.createElement(
                        "div"
                    );


                progressElement.innerHTML = `
                    <p>
                        <strong>Weight:</strong>
                        ${record.weight_kg} kg
                    </p>

                    <p>
                        <strong>BMI:</strong>
                        ${record.bmi}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${new Date(
                            record.recorded_at
                        ).toLocaleDateString()}
                    </p>
                `;


                container.appendChild(
                    progressElement
                );

            });
        }


        // --------------------------------------------------
        // PREPARE CHART DATA
        // --------------------------------------------------

        const orderedProgress =
            progress.slice().reverse();


        const labels =
            orderedProgress.map(
                (record) =>
                    new Date(
                        record.recorded_at
                    ).toLocaleDateString()
            );


        const weights =
            orderedProgress.map(
                (record) =>
                    Number(
                        record.weight_kg
                    )
            );


        const bmis =
            orderedProgress.map(
                (record) =>
                    Number(
                        record.bmi
                    )
            );


        // --------------------------------------------------
        // DESTROY OLD CHARTS
        // --------------------------------------------------

        if (weightChart) {

            weightChart.destroy();
        }


        if (bmiChart) {

            bmiChart.destroy();
        }


        // --------------------------------------------------
        // WEIGHT CHART
        // --------------------------------------------------

        const ctx =
            document.getElementById(
                "progressChart"
            );


        weightChart =
            new Chart(
                ctx,
                {
                    type: "line",

                    data: {
                        labels: labels,

                        datasets: [
                            {
                                label:
                                    "Weight (kg)",

                                data:
                                    weights,

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
                                title: {
                                    display:
                                        true,

                                    text:
                                        "Weight (kg)"
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


        // --------------------------------------------------
        // BMI CHART
        // --------------------------------------------------

        const bmiCtx =
            document.getElementById(
                "bmiChart"
            );


        bmiChart =
            new Chart(
                bmiCtx,
                {
                    type: "line",

                    data: {
                        labels: labels,

                        datasets: [
                            {
                                label:
                                    "BMI",

                                data:
                                    bmis,

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
                                title: {
                                    display:
                                        true,

                                    text:
                                        "BMI"
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
            "Error loading progress:",
            error
        );
    }
}


// --------------------------------------------------
// PROGRESS FORM
// --------------------------------------------------

const progressForm =
    document.getElementById(
        "progressForm"
    );


progressForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const userData =
            localStorage.getItem("user");

        const token =
            localStorage.getItem("token");


        if (
            !userData ||
            !token
        ) {

            window.location.href =
                "/login.html";

            return;
        }


        const user =
            JSON.parse(userData);


        const weight =
            document.getElementById(
                "weight"
            ).value;


        try {

            const response =
                await fetch(
                    "/api/progress",
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
                                weight
                            })
                    }
                );


            const result =
                await response.json();


            const message =
                document.getElementById(
                    "message"
                );


            message.textContent =
                result.message;


            if (response.ok) {

                message.className =
                    "progress-message success";

            } else {

                message.className =
                    "progress-message error";
            }


            if (response.ok) {

                document.getElementById(
                    "weight"
                ).value = "";


                loadProgress(
                    user.id
                );
            }


        } catch (error) {

            console.error(
                "Error recording progress:",
                error
            );


            document.getElementById(
                "message"
            ).textContent =
                "Something went wrong.";
        }
    }
);