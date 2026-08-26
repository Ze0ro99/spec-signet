---- MODULE signet_gates ----
CONSTANTS Nonces
VARIABLES claimed
Init == claimed = {}
Claim(n) == n \in Nonces /\ n \notin claimed /\ claimed' = claimed \cup {n}
Next == \E n \in Nonces : Claim(n)
NoEarlyBurn == claimed = {} 
OneClaim == \A n \in Nonces : n \in claimed => n \in claimed
THEOREM Spec == Init /\ [][Next]_claimed => []OneClaim
====
