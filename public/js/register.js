const form =
    document.getElementById("registerForm");


form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            document.getElementById("name").value;

        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        const age =
            document.getElementById("age").value;

        const weight =
            document.getElementById("weight").value;

        const height =
            document.getElementById("height").value;

        const goal =
            document.getElementById("goal").value;


        const userData = {
            name,
            email,
            password,
            age,
            weight,
            height,
            goal
        };


        const response =
            await fetch(
                "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            userData
                        )
                }
            );


        const result =
            await response.json();


        alert(
            result.message
        );
    }
);