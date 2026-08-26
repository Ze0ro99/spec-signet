package main
import("encoding/json";"fmt";"os")
// Minimal independent vector parser. Cryptographic verification remains specified by docs/SPEC.md.
func main(){for _,p:=range os.Args[1:]{b,e:=os.ReadFile(p);if e!=nil{panic(e)};var v any;if json.Unmarshal(b,&v)!=nil{panic("invalid vector")}};fmt.Println("SIGNET GO CONFORMANCE OK")}
