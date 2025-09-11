package differ

import (
	"encoding/json"
	"fmt"
)

func ExtractSimpleSchema(v interface{}) map[string]interface{} {
	schema := make(map[string]interface{})
	switch s := v.(type) {
	case map[string]interface{}:
		for k, val := range s {
			schema[k] = fmt.Sprintf("%T", val)
		}
	default:
		return map[string]interface{}{"type": fmt.Sprintf("%T", v)}
	}
	return schema
}

func SummarizeChange(oldHash *string, newHash string, oldSchemaHash *string, newSchemaHash string) string {
	parts := []string{}
	if oldHash == nil || *oldHash != newHash {
		parts = append(parts, "body-changed")
	}
	if oldSchemaHash == nil || *oldSchemaHash != newSchemaHash {
		parts = append(parts, "schema-changed")
	}
	if len(parts) == 0 {
		return "no-change"
	}
	d, _ := json.Marshal(parts)
	return string(d)
}
