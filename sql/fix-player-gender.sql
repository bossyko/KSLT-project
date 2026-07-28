-- Fix: set gender for players created without it
-- Maps profiles.gender (male/female) → players.gender (men/women)

UPDATE players p
SET gender = CASE
    WHEN pr.gender = 'male' THEN 'men'
    WHEN pr.gender = 'female' THEN 'women'
    ELSE 'men'
END
FROM profiles pr
WHERE pr.player_id = p.id
  AND p.gender IS NULL;
