package database

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"unsrate-backend-go/internal/config"
	"unsrate-backend-go/internal/models"
)

var DB *gorm.DB

func ConnectDB(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection successfully established")

	// Set connection pooling details
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to configure database pool: %v", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Run auto migrations
	err = DB.AutoMigrate(
		&models.User{},
		&models.Token{},
		&models.Interest{},
		&models.UserInterest{},
		&models.Swipe{},
		&models.Match{},
		&models.Message{},
		&models.Report{},
	)
	if err != nil {
		log.Printf("Warning: Database auto-migration failed: %v", err)
	} else {
		log.Println("Database auto-migration completed")
	}

	return DB
}
