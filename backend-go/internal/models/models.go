package models

import (
	"time"

	"github.com/lib/pq"
)

type Gender string
type UserRole string
type SwipeAction string

const (
	GenderMale   Gender = "MALE"
	GenderFemale Gender = "FEMALE"
	GenderAll    Gender = "ALL"

	RoleUser  UserRole = "USER"
	RoleAdmin UserRole = "ADMIN"

	ActionLike    SwipeAction = "LIKE"
	ActionDislike SwipeAction = "DISLIKE"
)

// User represents the users table in DB
type User struct {
	ID                 string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Fullname           string         `gorm:"type:varchar(255);not null" json:"fullname"`
	NIM                string         `gorm:"type:varchar(50);unique;not null" json:"nim"`
	Email              string         `gorm:"type:varchar(255);unique;not null" json:"email"`
	Password           string         `gorm:"type:varchar(255);not null" json:"-"`
	ProfilePicture     *string        `gorm:"type:text" json:"profilePicture"`
	Photos             pq.StringArray `gorm:"type:text[]" json:"photos"`
	Bio                *string        `gorm:"type:text" json:"bio"`
	Fakultas           *string        `gorm:"type:varchar(255)" json:"fakultas"`
	Prodi              *string        `gorm:"type:varchar(255)" json:"prodi"`
	DateOfBirth        *time.Time     `json:"dateOfBirth"`
	Age                int            `gorm:"not null" json:"age"`
	Gender             *Gender        `gorm:"type:varchar(20)" json:"gender"`
	Alamat             *string        `gorm:"type:text" json:"alamat"`
	LastOnline         *time.Time     `gorm:"default:now()" json:"lastOnline"`
	Verified           *bool          `gorm:"default:false" json:"verified"`
	Role               UserRole       `gorm:"type:varchar(20);default:'USER'" json:"role"`
	IsActive           bool           `gorm:"default:true" json:"isActive"`
	InterestedInGender *Gender        `gorm:"type:varchar(20)" json:"interestedInGender"`
	MinAgePreference   *int           `json:"minAgePreference"`
	MaxAgePreference   *int           `json:"maxAgePreference"`
	CreatedAt          time.Time      `gorm:"default:now()" json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`

	// Associations
	Tokens          []Token        `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	SwipesMade      []Swipe        `gorm:"foreignKey:SwiperUserID;constraint:OnDelete:CASCADE" json:"-"`
	SwipesReceived  []Swipe        `gorm:"foreignKey:SwipedUserID;constraint:OnDelete:CASCADE" json:"-"`
	UserInterests   []UserInterest `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"interests"`
}

// Token represents the session tokens table
type Token struct {
	ID        string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Token     string    `gorm:"type:varchar(255);unique;not null" json:"token"`
	UserID    string    `gorm:"type:varchar(30);not null" json:"userId"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	CreatedAt time.Time `gorm:"default:now()" json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

// Interest represents the static interests master table
type Interest struct {
	ID    string         `gorm:"primaryKey;type:varchar(30)" json:"id"`
	Name  string         `gorm:"type:varchar(100);unique;not null" json:"name"`
	Users []UserInterest `gorm:"foreignKey:InterestID;constraint:OnDelete:CASCADE" json:"-"`
}

// UserInterest represents user-selected interests mapping table
type UserInterest struct {
	UserID     string `gorm:"primaryKey;type:varchar(30)" json:"userId"`
	InterestID string `gorm:"primaryKey;type:varchar(30)" json:"interestId"`

	User     User     `gorm:"foreignKey:UserID" json:"-"`
	Interest Interest `gorm:"foreignKey:InterestID" json:"interest"`
}

// Swipe represents user swiping interactions
type Swipe struct {
	ID           string      `gorm:"primaryKey;type:varchar(30)" json:"id"`
	SwiperUserID string      `gorm:"type:varchar(30);uniqueIndex:idx_swiper_swiped;not null" json:"swiperUserId"`
	SwipedUserID string      `gorm:"type:varchar(30);uniqueIndex:idx_swiper_swiped;not null" json:"swipedUserId"`
	Action       SwipeAction `gorm:"type:varchar(20);not null" json:"action"`
	CreatedAt    time.Time   `gorm:"default:now()" json:"createdAt"`

	Swiper User `gorm:"foreignKey:SwiperUserID" json:"-"`
	Swiped User `gorm:"foreignKey:SwipedUserID" json:"-"`
}

// Match represents mutual likes that form a dating match
type Match struct {
	ID        string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	UserAId   string    `gorm:"type:varchar(30);uniqueIndex:idx_user_a_b;not null" json:"userAId"`
	UserBId   string    `gorm:"type:varchar(30);uniqueIndex:idx_user_a_b;not null" json:"userBId"`
	CreatedAt time.Time `gorm:"default:now()" json:"createdAt"`

	UserA    User      `gorm:"foreignKey:UserAId" json:"userA"`
	UserB    User      `gorm:"foreignKey:UserBId" json:"userB"`
	Messages []Message `gorm:"foreignKey:MatchID;constraint:OnDelete:CASCADE" json:"messages,omitempty"`
}

// Message represents chat messages between matched users
type Message struct {
	ID        string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	MatchID   string    `gorm:"type:varchar(30);not null" json:"matchId"`
	SenderID  string    `gorm:"type:varchar(30);not null" json:"senderId"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `gorm:"default:now()" json:"createdAt"`
	IsRead    bool      `gorm:"default:false" json:"isRead"`

	Match  Match `gorm:"foreignKey:MatchID" json:"-"`
	Sender User  `gorm:"foreignKey:SenderID" json:"-"`
}

// Report represents user reports for moderation
type Report struct {
	ID         string    `gorm:"primaryKey;type:varchar(30)" json:"id"`
	ReporterID string    `gorm:"type:varchar(30);not null" json:"reporterId"`
	ReportedID string    `gorm:"type:varchar(30);not null" json:"reportedId"`
	Reason     string    `gorm:"type:text;not null" json:"reason"`
	CreatedAt  time.Time `gorm:"default:now()" json:"createdAt"`

	Reporter User `gorm:"foreignKey:ReporterID" json:"-"`
	Reported User `gorm:"foreignKey:ReportedID" json:"-"`
}
