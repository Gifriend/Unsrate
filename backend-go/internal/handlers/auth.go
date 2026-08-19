package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"unsrate-backend-go/internal/database"
	"unsrate-backend-go/internal/models"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Fullname string `json:"fullname"`
	NIM      string `json:"nim"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Age      int    `json:"age"`
}

func Register(c *fiber.Ctx) error {
	req := new(RegisterRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON body",
		})
	}

	// Simple validation
	if req.Email == "" || req.Password == "" || req.Fullname == "" || req.NIM == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Fullname, NIM, Email and Password are required",
		})
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ? OR nim = ?", req.Email, req.NIM).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "User with this email or NIM already exists",
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to encrypt password",
		})
	}

	// Set default values and create ID
	userID := "u_" + time.Now().Format("060102150405") // Pseudo CUID/unique ID for demo
	newUser := models.User{
		ID:        userID,
		Fullname:  req.Fullname,
		NIM:       req.NIM,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Age:       req.Age,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user record",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully",
		"user":    newUser,
	})
}

func Login(c *fiber.Ctx) error {
	req := new(LoginRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON body",
		})
	}

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Create JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": user.ID,
		"email":  user.Email,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 24 * 7).Unix(), // 1 week expiry
	})

	jwtSecret := c.Locals("jwtSecret").(string)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not generate authentication token",
		})
	}

	// Optional: save to Token table
	sessionToken := models.Token{
		ID:        "t_" + time.Now().Format("060102150405"),
		Token:     tokenString,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(time.Hour * 24 * 7),
		CreatedAt: time.Now(),
	}
	database.DB.Create(&sessionToken)

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"token":   tokenString,
		"user":    user,
	})
}

// Middleware for JWT verification
func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing or invalid authorization token",
			})
		}

		tokenString := authHeader[7:]
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: Token is expired or invalid",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: Could not parse token claims",
			})
		}

		// Inject userId and role into context locals
		c.Locals("userId", claims["userId"].(string))
		c.Locals("role", claims["role"].(string))

		return c.Next()
	}
}
