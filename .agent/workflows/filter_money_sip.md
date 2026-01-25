---
description: Apply filters to sip_money_details/page.jsx to only show Money SIPs
---

1.  In `transformFixedSIPsData`, add `if(metalType !== 'Money') return;` to the loop to filter out non-Money Fixed SIPs.
2.  In `transformFlexibleSIPData`, add `if(metalType !== 'Money') return;` to the loop to filter out non-Money Flexible SIPs.
3.  In `transformSIPData` (for customers), add the same filtering for both Fixed and Flexible lists.
4.  Update `getDisplayMetalType` to explicitly handle 'Money'.
