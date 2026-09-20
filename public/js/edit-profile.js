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

    loadProfile(user.id);
}


// LOAD PROFILE

async function loadProfile(userId) {

    const message =
        document.getElementById(
            "profileMessage"
        );


    message.textContent =
        "Loading profile...";

    message.className =
        "progress-message";


    try {

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

            message.textContent =
                "Failed to load profile.";

            message.className =
                "progress-message error";

            return;
        }


        document.getElementById("name").value =
            profile.name;

        document.getElementById("email").value =
            profile.email;

        document.getElementById("age").value =
            profile.age;

        document.getElementById("height").value =
            profile.height_cm;

        document.getElementById("weight").value =
            profile.weight_kg;

        document.getElementById("goal").value =
            profile.goal || "";


        message.textContent = "";


    } catch (error) {

        console.error(
            "Error loading profile:",
            error
        );

        message.textContent =
            "Something went wrong while loading your profile.";

        message.className =
            "progress-message error";
    }
}

// EDIT PROFILE FORM

const editProfileForm =
    document.getElementById(
        "editProfileForm"
    );


editProfileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const currentUserData =
            localStorage.getItem("user");

        const currentToken =
            localStorage.getItem("token");


        if (
            !currentUserData ||
            !currentToken
        ) {

            window.location.href =
                "/login.html";

            return;
        }


        const user =
            JSON.parse(
                currentUserData
            );


        const name =
            document.getElementById(
                "name"
            ).value;

        const email =
            document.getElementById(
                "email"
            ).value;

        const age =
            document.getElementById(
                "age"
            ).value;

        const height =
            document.getElementById(
                "height"
            ).value;

        const weight =
            document.getElementById(
                "weight"
            ).value;

        const goal =
            document.getElementById(
                "goal"
            ).value;


        const message =
            document.getElementById(
                "profileMessage"
            );


        const submitButton =
            editProfileForm.querySelector(
                "button[type='submit']"
            );


        submitButton.disabled =
            true;

        submitButton.textContent =
            "Updating...";


        try {

            const response =
                await fetch(
                    `/api/profile/${user.id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${currentToken}`
                        },

                        body:
                            JSON.stringify({
                                name,
                                email,
                                age,
                                height,
                                weight,
                                goal
                            })
                    }
                );


            const result =
                await response.json();


            message.textContent =
                result.message;


            if (response.ok) {

                message.className =
                    "progress-message success";


                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        id:
                            user.id,

                        name:
                            name,

                        email:
                            email
                    })
                );


                setTimeout(() => {

                    window.location.href =
                        "/dashboard.html";

                }, 1000);


            } else {

                message.className =
                    "progress-message error";


                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Update Profile";
            }


        } catch (error) {

            console.error(
                "Error updating profile:",
                error
            );

            message.textContent =
                "Something went wrong.";

            message.className =
                "progress-message error";


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Update Profile";
        }
    }
);