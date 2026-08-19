package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"unsrate-backend-go/internal/database"
	"unsrate-backend-go/internal/models"
)

type SendMessageRequest struct {
	Content string `json:"content"`
}

// GetMessages retrieves messages for a specific match with authorization check
func GetMessages(c *fiber.Ctx) error {
	currentUserID := c.Locals("userId").(string)
	matchID := c.Params("matchId")

	// 1. Fetch match to ensure current user is part of it
	var match models.Match
	if err := database.DB.First(&match, "id = ?", matchID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Match not found",
		})
	}

	if match.UserAId != currentUserID && match.UserBId != currentUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You do not have access to this conversation",
		})
	}

	// 2. Fetch messages ordered by creation time
	var messages []models.Message
	if err := database.DB.Order("created_at asc").Find(&messages, "match_id = ?", matchID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not fetch messages",
		})
	}

	return c.JSON(fiber.Map{
		"messages": messages,
	})
}

// SendMessage posts a message to a specific match with authorization check
func SendMessage(c *fiber.Ctx) error {
	currentUserID := c.Locals("userId").(string)
	matchID := c.Params("matchId")

	req := new(SendMessageRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON body",
		})
	}

	if req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Message content cannot be empty",
		})
	}

	// 1. Verify match exists and current user is authorized to send message
	var match models.Match
	if err := database.DB.First(&match, "id = ?", matchID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Match not found",
		})
	}

	if match.UserAId != currentUserID && match.UserBId != currentUserID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "You are not authorized to send messages to this match",
		})
	}

	// 2. Create and persist message
	messageID := "msg_" + time.Now().Format("060102150405")
	newMessage := models.Message{
		ID:        messageID,
		MatchID:   matchID,
		SenderID:  currentUserID,
		Content:   req.Content,
		CreatedAt: time.Now(),
		IsRead:    false,
	}

	if err := database.DB.Create(&newMessage).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save message",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": newMessage,
	})
}
