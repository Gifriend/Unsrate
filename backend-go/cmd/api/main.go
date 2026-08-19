package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"unsrate-backend-go/internal/config"
	"unsrate-backend-go/internal/database"
	"unsrate-backend-go/internal/routes"
)

func main() {
	// 1. Load Configurations
	cfg := config.LoadConfig()

	// 2. Initialize Database Connection
	database.ConnectDB(cfg)

	// 3. Initialize Fiber App
	app := fiber.New(fiber.Config{
		AppName: "UNSRATE Dating Core API",
	})

	// Add recover middleware to prevent crashes on panics
	app.Use(recover.New())
	// Add log middleware to display request details in console
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))

	// 4. Setup Routes
	routes.SetupRoutes(app, cfg)

	// 5. Start Server
	serverPort := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("UNSRATE Go Backend is running on port %s", cfg.Port)
	if err := app.Listen(serverPort); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}
