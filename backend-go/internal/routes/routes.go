package routes

import (
	"github.com/gofiber/fiber/v2"
	"unsrate-backend-go/internal/config"
	"unsrate-backend-go/internal/handlers"
)

func SetupRoutes(app *fiber.App, cfg *config.Config) {
	// Pass JWT Secret down via context middleware
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("jwtSecret", cfg.JWTSecret)
		return c.Next()
	})

	api := app.Group("/api")

	// --- Public Auth Routes ---
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// --- Protected Routes ---
	protected := api.Group("", handlers.AuthRequired(cfg.JWTSecret))

	// Discovery
	protected.Get("/discovery", handlers.GetDiscovery)

	// Swipes
	protected.Post("/swipes", handlers.CreateSwipe)

	// Messaging
	protected.Get("/messages/:matchId", handlers.GetMessages)
	protected.Post("/messages/:matchId", handlers.SendMessage)
}
