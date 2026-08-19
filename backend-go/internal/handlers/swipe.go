package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"unsrate-backend-go/internal/database"
	"unsrate-backend-go/internal/models"
)

type SwipeRequest struct {
	SwipedUserID string             `json:"swipedUserId"`
	Action       models.SwipeAction `json:"action"` // LIKE or DISLIKE
}

func CreateSwipe(c *fiber.Ctx) error {
	swiperUserID := c.Locals("userId").(string)

	req := new(SwipeRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON body",
		})
	}

	if req.SwipedUserID == "" || (req.Action != models.ActionLike && req.Action != models.ActionDislike) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid swipe request. Target user ID and action are required",
		})
	}

	if swiperUserID == req.SwipedUserID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "You cannot swipe on yourself",
		})
	}

	swipeID := "s_" + time.Now().Format("060102150405")
	swipe := models.Swipe{
		ID:           swipeID,
		SwiperUserID: swiperUserID,
		SwipedUserID: req.SwipedUserID,
		Action:       req.Action,
		CreatedAt:    time.Now(),
	}

	var isMatch = false
	var newMatch models.Match

	// Run inside a database transaction to ensure safety
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create swipe record (or fail if duplicate swipe due to database @@unique check)
		if err := tx.Create(&swipe).Error; err != nil {
			return err
		}

		// 2. If it's a LIKE, check if the other user has already LIKEd the swiper
		if req.Action == models.ActionLike {
			var mutualSwipe models.Swipe
			err := tx.Where("swiper_user_id = ? AND swiped_user_id = ? AND action = ?",
				req.SwipedUserID, swiperUserID, models.ActionLike).First(&mutualSwipe).Error

			if err == nil {
				// It's a match!
				isMatch = true
				matchID := "m_" + time.Now().Format("060102150405")

				// To avoid duplicate A->B vs B->A issues, enforce UserAId is lexicographically smaller
				userAId, userBId := swiperUserID, req.SwipedUserID
				if userBId < userAId {
					userAId, userBId = userBId, userAId
				}

				newMatch = models.Match{
					ID:        matchID,
					UserAId:   userAId,
					UserBId:   userBId,
					CreatedAt: time.Now(),
				}

				// Check if match already exists (safety check)
				var existingMatch models.Match
				matchCheckErr := tx.Where("user_a_id = ? AND user_b_id = ?", userAId, userBId).First(&existingMatch).Error
				if matchCheckErr != nil { // Match does not exist, safe to create
					if err := tx.Create(&newMatch).Error; err != nil {
						return err
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Failed to record swipe (you might have swiped on this user already)",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Swipe recorded successfully",
		"match":   isMatch,
		"matchDetails": func() interface{} {
			if isMatch {
				return newMatch
			}
			return nil
		}(),
	})
}
