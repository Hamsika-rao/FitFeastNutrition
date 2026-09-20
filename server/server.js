const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 3000;


// Security middleware

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net"
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'"
                ],

                imgSrc: [
                    "'self'",
                    "data:"
                ],

                connectSrc: [
                    "'self'"
                ]
            }
        }
    })
);

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            "http://localhost:3000"
    })
);

app.use(
    express.json({
        limit: "10kb"
    })
);

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);


// Rate limiting

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        message:
            "Too many authentication attempts. Please try again later."
    }
});


// Authentication

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            message:
                "Authentication required."
        });
    }

    const parts =
        authHeader.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer" ||
        !parts[1]
    ) {
        return res.status(401).json({
            message:
                "Invalid authorization header."
        });
    }

    const token = parts[1];

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (!decoded.userId) {
            return res.status(403).json({
                message:
                    "Invalid authentication token."
            });
        }

        req.userId =
            decoded.userId;

        next();

    } catch (error) {

        return res.status(403).json({
            message:
                "Invalid or expired token."
        });
    }
}


// Validation helpers

function isValidEmail(email) {

    return (
        typeof email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}


function isValidPassword(password) {

    return (
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 100
    );
}


function isValidName(name) {

    return (
        typeof name === "string" &&
        name.trim().length >= 2 &&
        name.trim().length <= 100
    );
}


function isValidAge(age) {

    const value = Number(age);

    return (
        Number.isInteger(value) &&
        value >= 13 &&
        value <= 120
    );
}


function isValidHeight(height) {

    const value = Number(height);

    return (
        Number.isFinite(value) &&
        value >= 50 &&
        value <= 250
    );
}


function isValidWeight(weight) {

    const value = Number(weight);

    return (
        Number.isFinite(value) &&
        value > 0 &&
        value <= 500
    );
}


function isValidGoal(goal) {

    const validGoals = [
        "Weight Loss",
        "Weight Gain",
        "Maintain Weight"
    ];

    return (
        goal === undefined ||
        goal === null ||
        validGoals.includes(goal)
    );
}


function isValidMealType(mealType) {

    const validMealTypes = [
        "Breakfast",
        "Lunch",
        "Snack",
        "Dinner"
    ];

    return validMealTypes.includes(
        mealType
    );
}


function isValidQuantity(quantity) {

    const value = Number(quantity);

    return (
        Number.isFinite(value) &&
        value > 0 &&
        value <= 20
    );
}


// Register

app.post(
    "/api/register",
    authLimiter,
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const {
                name,
                email,
                password,
                age,
                weight,
                height,
                goal
            } = req.body;


            if (!isValidName(name)) {
                return res.status(400).json({
                    message:
                        "Name must contain 2-100 characters."
                });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({
                    message:
                        "Please enter a valid email address."
                });
            }

            if (!isValidPassword(password)) {
                return res.status(400).json({
                    message:
                        "Password must be between 8 and 100 characters."
                });
            }

            if (!isValidAge(age)) {
                return res.status(400).json({
                    message:
                        "Age must be between 13 and 120."
                });
            }

            if (!isValidHeight(height)) {
                return res.status(400).json({
                    message:
                        "Height must be between 50 and 250 cm."
                });
            }

            if (!isValidWeight(weight)) {
                return res.status(400).json({
                    message:
                        "Weight must be between 1 and 500 kg."
                });
            }

            if (!isValidGoal(goal)) {
                return res.status(400).json({
                    message:
                        "Invalid fitness goal."
                });
            }


            const heightNumber =
                Number(height);

            const weightNumber =
                Number(weight);

            const ageNumber =
                Number(age);

            const heightInMeters =
                heightNumber / 100;

            const bmi =
                weightNumber /
                (
                    heightInMeters *
                    heightInMeters
                );

            const bmr =
                (10 * weightNumber) +
                (6.25 * heightNumber) -
                (5 * ageNumber);

            const calorieTarget =
                Math.round(
                    bmr * 1.55
                );


            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            await client.query("BEGIN");


            const userResult =
                await client.query(
                    `INSERT INTO users
                        (
                            name,
                            email,
                            password_hash
                        )
                     VALUES
                        ($1, $2, $3)
                     RETURNING
                        id,
                        name,
                        email`,
                    [
                        name.trim(),
                        email.trim().toLowerCase(),
                        passwordHash
                    ]
                );


            const user =
                userResult.rows[0];


            await client.query(
                `INSERT INTO profiles
                    (
                        user_id,
                        age,
                        height_cm,
                        weight_kg,
                        bmi,
                        goal,
                        calorie_target
                    )
                 VALUES
                    ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    user.id,
                    ageNumber,
                    heightNumber,
                    weightNumber,
                    bmi.toFixed(2),
                    goal || null,
                    calorieTarget
                ]
            );


            await client.query("COMMIT");


            res.status(201).json({
                message:
                    "Registration successful!"
            });

        } catch (error) {

            await client.query("ROLLBACK");

            console.error(
                "Registration error:",
                error
            );

            if (
                error.code === "23505"
            ) {
                return res.status(409).json({
                    message:
                        "Email already registered."
                });
            }

            res.status(500).json({
                message:
                    "Registration failed."
            });

        } finally {

            client.release();
        }
    }
);


// Login

app.post(
    "/api/login",
    authLimiter,
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !isValidEmail(email) ||
                typeof password !== "string" ||
                password.length === 0
            ) {
                return res.status(400).json({
                    message:
                        "Please enter a valid email and password."
                });
            }


            const result =
                await pool.query(
                    `SELECT
                        id,
                        name,
                        email,
                        password_hash
                     FROM users
                     WHERE email = $1`,
                    [
                        email.trim().toLowerCase()
                    ]
                );


            if (
                result.rows.length === 0
            ) {
                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });
            }


            const user =
                result.rows[0];


            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );


            if (!passwordMatch) {
                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });
            }


            const token =
                jwt.sign(
                    {
                        userId:
                            user.id
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn:
                            "1d"
                    }
                );


            res.json({

                token: token,

                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res.status(500).json({
                message:
                    "Login failed."
            });
        }
    }
);


// Get profile

app.get(
    "/api/profile/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const result =
                await pool.query(
                    `SELECT
                        users.id,
                        users.name,
                        users.email,
                        profiles.age,
                        profiles.height_cm,
                        profiles.weight_kg,
                        profiles.bmi,
                        profiles.goal,
                        profiles.calorie_target
                     FROM users
                     JOIN profiles
                        ON users.id =
                           profiles.user_id
                     WHERE users.id = $1`,
                    [userId]
                );


            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    message:
                        "Profile not found."
                });
            }


            const profile =
                result.rows[0];


            let bmiStatus;


            if (profile.bmi < 18.5) {

                bmiStatus =
                    "Underweight";

            } else if (
                profile.bmi < 25
            ) {

                bmiStatus =
                    "Normal";

            } else if (
                profile.bmi < 30
            ) {

                bmiStatus =
                    "Overweight";

            } else {

                bmiStatus =
                    "Obese";
            }


            profile.bmi_status =
                bmiStatus;


            res.json(profile);

        } catch (error) {

            console.error(
                "Profile fetch error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch profile."
            });
        }
    }
);


// Update profile

app.put(
    "/api/profile/:userId",
    authenticateToken,
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const userId =
                req.userId;


            const {
                name,
                email,
                age,
                height,
                weight,
                goal
            } = req.body;


            if (!isValidName(name)) {
                return res.status(400).json({
                    message:
                        "Name must contain 2-100 characters."
                });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({
                    message:
                        "Please enter a valid email address."
                });
            }

            if (!isValidAge(age)) {
                return res.status(400).json({
                    message:
                        "Age must be between 13 and 120."
                });
            }

            if (!isValidHeight(height)) {
                return res.status(400).json({
                    message:
                        "Height must be between 50 and 250 cm."
                });
            }

            if (!isValidWeight(weight)) {
                return res.status(400).json({
                    message:
                        "Weight must be between 1 and 500 kg."
                });
            }

            if (!isValidGoal(goal)) {
                return res.status(400).json({
                    message:
                        "Invalid fitness goal."
                });
            }


            const ageNumber =
                Number(age);

            const heightNumber =
                Number(height);

            const weightNumber =
                Number(weight);


            const heightInMeters =
                heightNumber / 100;


            const bmi =
                weightNumber /
                (
                    heightInMeters *
                    heightInMeters
                );


            const bmr =
                (10 * weightNumber) +
                (6.25 * heightNumber) -
                (5 * ageNumber);


            const calorieTarget =
                Math.round(
                    bmr * 1.55
                );


            await client.query("BEGIN");


            await client.query(
                `UPDATE users
                 SET
                    name = $1,
                    email = $2
                 WHERE id = $3`,
                [
                    name.trim(),
                    email.trim().toLowerCase(),
                    userId
                ]
            );


            await client.query(
                `UPDATE profiles
                 SET
                    age = $1,
                    height_cm = $2,
                    weight_kg = $3,
                    bmi = $4,
                    goal = $5,
                    calorie_target = $6
                 WHERE user_id = $7`,
                [
                    ageNumber,
                    heightNumber,
                    weightNumber,
                    bmi.toFixed(2),
                    goal || null,
                    calorieTarget,
                    userId
                ]
            );


            await client.query("COMMIT");


            res.json({
                message:
                    "Profile updated successfully!"
            });

        } catch (error) {

            await client.query("ROLLBACK");

            console.error(
                "Profile update error:",
                error
            );

            if (
                error.code === "23505"
            ) {
                return res.status(409).json({
                    message:
                        "Email already registered."
                });
            }

            res.status(500).json({
                message:
                    "Failed to update profile."
            });

        } finally {

            client.release();
        }
    }
);


// Meal plan

app.get(
    "/api/meal-plan/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const profileResult =
                await pool.query(
                    `SELECT
                        goal,
                        calorie_target
                     FROM profiles
                     WHERE user_id = $1`,
                    [userId]
                );


            if (
                profileResult.rows.length === 0
            ) {
                return res.status(404).json({
                    message:
                        "Profile not found."
                });
            }


            const profile =
                profileResult.rows[0];


            const goal =
                profile.goal;


            const calorieTarget =
                Number(
                    profile.calorie_target
                );


            const breakfastCalories =
                Math.round(
                    calorieTarget * 0.25
                );

            const lunchCalories =
                Math.round(
                    calorieTarget * 0.35
                );

            const snackCalories =
                Math.round(
                    calorieTarget * 0.10
                );

            const dinnerCalories =
                Math.round(
                    calorieTarget * 0.30
                );


            const mealsResult =
                await pool.query(
                    `SELECT
                        id,
                        name,
                        category,
                        calories,
                        protein_g,
                        carbs_g,
                        fat_g
                     FROM meals
                     ORDER BY
                        category,
                        name`
                );


            const meals =
                mealsResult.rows;


            function findMeals(
                category,
                targetCalories,
                goal
            ) {

                const categoryMeals =
                    meals.filter(
                        meal =>
                            meal.category ===
                            category
                    );


                if (
                    categoryMeals.length === 0
                ) {
                    return [];
                }


                const scoredMeals =
                    categoryMeals.map(
                        meal => {

                            const calorieDifference =
                                Math.abs(
                                    meal.calories -
                                    targetCalories
                                );


                            let score =
                                calorieDifference;


                            if (
                                goal ===
                                "Weight Loss"
                            ) {

                                if (
                                    meal.calories <=
                                    targetCalories
                                ) {
                                    score -= 50;
                                }

                                score -=
                                    meal.protein_g * 2;
                            }


                            else if (
                                goal ===
                                "Weight Gain"
                            ) {

                                if (
                                    meal.calories >=
                                    targetCalories
                                ) {
                                    score -= 50;
                                }

                                score -=
                                    meal.protein_g * 2;
                            }


                            else if (
                                goal ===
                                "Maintain Weight"
                            ) {

                                score -=
                                    meal.protein_g;
                            }


                            return {
                                meal: meal,
                                score: score
                            };
                        }
                    );


                scoredMeals.sort(
                    (a, b) =>
                        a.score - b.score
                );


                return scoredMeals
                    .slice(0, 3)
                    .map(item => {

                        const meal =
                            item.meal;


                        return {
                            ...meal,

                            recommendedQuantity:
                                Number(
                                    (
                                        targetCalories /
                                        meal.calories
                                    ).toFixed(2)
                                )
                        };
                    });
            }


            const plan = {

                goal:
                    goal || "Not set",

                calorieTarget:
                    calorieTarget,

                breakfast:
                    findMeals(
                        "Breakfast",
                        breakfastCalories,
                        goal
                    ),

                lunch:
                    findMeals(
                        "Lunch",
                        lunchCalories,
                        goal
                    ),

                snack:
                    findMeals(
                        "Snack",
                        snackCalories,
                        goal
                    ),

                dinner:
                    findMeals(
                        "Dinner",
                        dinnerCalories,
                        goal
                    )
            };


            res.json(plan);

        } catch (error) {

            console.error(
                "Meal plan error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to generate meal plan."
            });
        }
    }
);


// Public meal catalog

app.get(
    "/api/meals",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `SELECT
                        id,
                        name,
                        category,
                        calories,
                        protein_g,
                        carbs_g,
                        fat_g
                     FROM meals
                     ORDER BY
                        category,
                        name`
                );


            res.json(
                result.rows
            );

        } catch (error) {

            console.error(
                "Meals fetch error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch meals."
            });
        }
    }
);


// Create meal log

app.post(
    "/api/meal-logs",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                mealId,
                mealType,
                quantity
            } = req.body;


            const userId =
                req.userId;


            const mealIdNumber =
                Number(mealId);


            if (
                !Number.isInteger(
                    mealIdNumber
                ) ||
                mealIdNumber <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Invalid meal."
                });
            }


            if (
                !isValidMealType(
                    mealType
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid meal type."
                });
            }


            if (
                !isValidQuantity(
                    quantity
                )
            ) {
                return res.status(400).json({
                    message:
                        "Quantity must be greater than 0 and at most 20."
                });
            }


            const mealExists =
                await pool.query(
                    `SELECT id
                     FROM meals
                     WHERE id = $1`,
                    [mealIdNumber]
                );


            if (
                mealExists.rows.length === 0
            ) {
                return res.status(404).json({
                    message:
                        "Meal not found."
                });
            }


            await pool.query(
                `INSERT INTO meal_logs
                    (
                        user_id,
                        meal_id,
                        meal_type,
                        quantity
                    )
                 VALUES
                    ($1, $2, $3, $4)`,
                [
                    userId,
                    mealIdNumber,
                    mealType,
                    Number(quantity)
                ]
            );


            res.status(201).json({
                message:
                    "Meal logged successfully!"
            });

        } catch (error) {

            console.error(
                "Meal log error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to log meal."
            });
        }
    }
);


// Today's meal logs

app.get(
    "/api/meal-logs/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const result =
                await pool.query(
                    `SELECT
                        meal_logs.id,
                        meals.name,
                        meals.category,
                        meals.calories,
                        meals.protein_g,
                        meals.carbs_g,
                        meals.fat_g,
                        meal_logs.meal_type,
                        meal_logs.quantity,
                        meal_logs.logged_at
                     FROM meal_logs
                     JOIN meals
                        ON meal_logs.meal_id =
                           meals.id
                     WHERE meal_logs.user_id = $1
                       AND meal_logs.logged_at::date =
                           CURRENT_DATE
                     ORDER BY
                        meal_logs.logged_at DESC`,
                    [userId]
                );


            res.json(
                result.rows
            );

        } catch (error) {

            console.error(
                "Today's meals error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch meal logs."
            });
        }
    }
);


// Meal history

app.get(
    "/api/meal-history/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const result =
                await pool.query(
                    `SELECT
                        meal_logs.id,
                        meals.name,
                        meals.category,
                        meals.calories,
                        meal_logs.meal_type,
                        meal_logs.quantity,
                        meal_logs.logged_at
                     FROM meal_logs
                     JOIN meals
                        ON meal_logs.meal_id =
                           meals.id
                     WHERE meal_logs.user_id = $1
                     ORDER BY
                        meal_logs.logged_at DESC`,
                    [userId]
                );


            res.json(
                result.rows
            );

        } catch (error) {

            console.error(
                "Meal history error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch meal history."
            });
        }
    }
);


// Nutrition report

app.get(
    "/api/reports/nutrition/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const result =
                await pool.query(
                    `SELECT
                        dates.date,

                        COALESCE(
                            SUM(
                                meals.protein_g *
                                meal_logs.quantity
                            ),
                            0
                        ) AS protein,

                        COALESCE(
                            SUM(
                                meals.carbs_g *
                                meal_logs.quantity
                            ),
                            0
                        ) AS carbs,

                        COALESCE(
                            SUM(
                                meals.fat_g *
                                meal_logs.quantity
                            ),
                            0
                        ) AS fat

                     FROM generate_series(
                            CURRENT_DATE -
                            INTERVAL '6 days',

                            CURRENT_DATE,

                            INTERVAL '1 day'
                     ) AS dates(date)

                     LEFT JOIN meal_logs
                        ON meal_logs.user_id = $1
                        AND meal_logs.logged_at::date =
                            dates.date

                     LEFT JOIN meals
                        ON meal_logs.meal_id =
                           meals.id

                     GROUP BY
                        dates.date

                     ORDER BY
                        dates.date ASC`,
                    [userId]
                );


            res.json(
                result.rows.map(
                    record => ({

                        date:
                            record.date,

                        protein:
                            Number(
                                record.protein
                            ),

                        carbs:
                            Number(
                                record.carbs
                            ),

                        fat:
                            Number(
                                record.fat
                            )
                    })
                )
            );

        } catch (error) {

            console.error(
                "Nutrition report error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch nutrition report."
            });
        }
    }
);


// Calorie report

app.get(
    "/api/reports/calories/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const profileResult =
                await pool.query(
                    `SELECT
                        calorie_target
                     FROM profiles
                     WHERE user_id = $1`,
                    [userId]
                );


            if (
                profileResult.rows.length === 0
            ) {
                return res.status(404).json({
                    message:
                        "Profile not found."
                });
            }


            const calorieTarget =
                Number(
                    profileResult.rows[0]
                        .calorie_target
                );


            const result =
                await pool.query(
                    `SELECT
                        dates.date,

                        COALESCE(
                            SUM(
                                meals.calories *
                                meal_logs.quantity
                            ),
                            0
                        ) AS total_calories

                     FROM generate_series(
                            CURRENT_DATE -
                            INTERVAL '6 days',

                            CURRENT_DATE,

                            INTERVAL '1 day'
                     ) AS dates(date)

                     LEFT JOIN meal_logs
                        ON meal_logs.user_id = $1
                        AND meal_logs.logged_at::date =
                            dates.date

                     LEFT JOIN meals
                        ON meal_logs.meal_id =
                           meals.id

                     GROUP BY
                        dates.date

                     ORDER BY
                        dates.date ASC`,
                    [userId]
                );


            res.json({

                calorieTarget:
                    calorieTarget,

                data:
                    result.rows
            });

        } catch (error) {

            console.error(
                "Calorie report error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch calorie report."
            });
        }
    }
);


// Get progress

app.get(
    "/api/progress/:userId",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.userId;


            const result =
                await pool.query(
                    `SELECT
                        id,
                        weight_kg,
                        bmi,
                        recorded_at
                     FROM progress
                     WHERE user_id = $1
                     ORDER BY
                        recorded_at DESC,
                        id DESC`,
                    [userId]
                );


            res.json(
                result.rows
            );

        } catch (error) {

            console.error(
                "Progress fetch error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch progress."
            });
        }
    }
);


// Create progress record

app.post(
    "/api/progress",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                weight
            } = req.body;


            const userId =
                req.userId;


            if (
                !isValidWeight(weight)
            ) {
                return res.status(400).json({
                    message:
                        "Please enter a valid weight between 1 and 500 kg."
                });
            }


            const weightNumber =
                Number(weight);


            const profileResult =
                await pool.query(
                    `SELECT
                        height_cm
                     FROM profiles
                     WHERE user_id = $1`,
                    [userId]
                );


            if (
                profileResult.rows.length === 0
            ) {
                return res.status(404).json({
                    message:
                        "Profile not found."
                });
            }


            const height =
                Number(
                    profileResult.rows[0]
                        .height_cm
                );


            const heightInMeters =
                height / 100;


            const bmi =
                weightNumber /
                (
                    heightInMeters *
                    heightInMeters
                );


            await pool.query(
                `INSERT INTO progress
                    (
                        user_id,
                        weight_kg,
                        bmi
                    )
                 VALUES
                    ($1, $2, $3)`,
                [
                    userId,
                    weightNumber,
                    bmi.toFixed(2)
                ]
            );


            res.status(201).json({
                message:
                    "Progress recorded successfully!"
            });

        } catch (error) {

            console.error(
                "Progress record error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to record progress."
            });
        }
    }
);


// Delete meal log

app.delete(
    "/api/meal-logs/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const logId =
                Number(req.params.id);


            if (
                !Number.isInteger(logId) ||
                logId <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Invalid meal log."
                });
            }


            const result =
                await pool.query(
                    `DELETE FROM meal_logs
                     WHERE id = $1
                       AND user_id = $2
                     RETURNING id`,
                    [
                        logId,
                        req.userId
                    ]
                );


            if (
                result.rows.length === 0
            ) {
                return res.status(404).json({
                    message:
                        "Meal log not found."
                });
            }


            res.json({
                message:
                    "Meal deleted successfully!"
            });

        } catch (error) {

            console.error(
                "Delete meal error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to delete meal."
            });
        }
    }
);


// Global error handler

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            message:
                "An unexpected server error occurred."
        });
    }
);


// Database test

pool.query(
    "SELECT NOW()",
    (error, result) => {

        if (error) {

            console.error(
                "Database connection failed:",
                error
            );

        } else {

            console.log(
                "Database connected successfully!"
            );

            console.log(
                "Database time:",
                result.rows[0].now
            );
        }
    }
);


// Start server

app.listen(
    PORT,
    () => {

        console.log(
            `FitFeast server is running on port ${PORT}`
        );
    }
);