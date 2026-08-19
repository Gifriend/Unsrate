package handlers

import (
	"github.com/gofiber/fiber/v2"
	"unsrate-backend-go/internal/database"
	"unsrate-backend-go/internal/models"
)

func GetDiscovery(c *fiber.Ctx) error {
	currentUserID := c.Locals("userId").(string)

	// 1. Fetch current user to check their preferences
	var currentUser models.User
	if err := database.DB.Preload("UserInterests").First(&currentUser, "id = ?", currentUserID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Current user record not found",
		})
	}

	// 2. Fetch list of IDs of users already swiped on by current user
	var swipedUserIDs []string
	database.DB.Model(&models.Swipe{}).
		Where("swiper_user_id = ?", currentUserID).
		Pluck("swiped_user_id", &swipedUserIDs)

	// Ensure we exclude the user themselves
	excludedIDs := append(swipedUserIDs, currentUserID)

	// 3. Build query for discovery recommendations
	query := database.DB.Model(&models.User{}).
		Preload("UserInterests.Interest").
		Where("id NOT IN ?", excludedIDs).
		Where("is_active = ?", true)

	// Filter by gender preference
	if currentUser.InterestedInGender != nil && *currentUser.InterestedInGender != models.GenderAll {
		query = query.Where("gender = ?", *currentUser.InterestedInGender)
	}

	// Filter by age preferences
	if currentUser.MinAgePreference != nil {
		query = query.Where("age >= ?", *currentUser.MinAgePreference)
	}
	if currentUser.MaxAgePreference != nil {
		query = query.Where("age <= ?", *currentUser.MaxAgePreference)
	}

	// Limit to 20 profiles per page / fetch
	var potentialMatches []models.User
	if err := query.Limit(20).Find(&potentialMatches).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch potential matches",
		})
	}

	// 4. (Optional) Simple interest similarity ranking
	// Calculate shared interests to order recommendations
	currentUserInterests := make(map[string]bool)
	for _, ui := range currentUser.UserInterests {
		currentUserInterests[ui.InterestID] = true
	}

	type RankedMatch struct {
		User           models.User `json:"user"`
		SharedInterests int         `json:"sharedInterestsCount"`
	}

	rankedMatches := []RankedMatch{}
	for _, pm := range potentialMatches {
		sharedCount := 0
		for _, ui := range pm.UserInterests {
			if currentUserInterests[ui.InterestID] {
				sharedCount++
			}
		}
		rankedMatches = append(rankedMatches, RankedMatch{
			User:           pm,
			SharedInterests: sharedCount,
		})
	}

	return c.JSON(fiber.Map{
		"results": rankedMatches,
	})
}
