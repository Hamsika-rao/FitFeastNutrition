const form =
    document.getElementById("loginForm");

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;


        const response =
            await fetch(
                "/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );


        const result =
            await response.json();


        if (response.ok) {

            localStorage.setItem(
                "token",
                result.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    result.user
                )
            );

            window.location.href =
                "/dashboard.html";

        } else {

            alert(
                result.message
            );
        }
    }
);