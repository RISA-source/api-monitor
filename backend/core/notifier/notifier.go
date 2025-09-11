package notifier

import (
	"log"
)

type Notifier struct{}

func NewNotifier() *Notifier { return &Notifier{} }

func (n *Notifier) NotifyChange(apiID int, summary string) {
	// In MVP just log. Hook email/webhook later.
	log.Printf("notify api=%d summary=%s\n", apiID, summary)
}
