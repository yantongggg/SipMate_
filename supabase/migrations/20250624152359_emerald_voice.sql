/*
  # Update Sample Wine Data

  1. Update existing wines with new fields
  2. Add more comprehensive wine data
*/

-- Update existing wines with additional data
UPDATE wines SET 
  winery = CASE 
    WHEN name = 'Château Margaux' THEN 'Château Margaux'
    WHEN name = 'Dom Pérignon' THEN 'Moët & Chandon'
    WHEN name = 'Caymus Cabernet Sauvignon' THEN 'Caymus Vineyards'
    WHEN name = 'Sancerre Loire Valley' THEN 'Henri Bourgeois'
    WHEN name = 'Barolo Brunate' THEN 'Giuseppe Rinaldi'
    WHEN name = 'Whispering Angel Rosé' THEN 'Château d''Esclans'
    WHEN name = 'Riesling Kabinett' THEN 'Dr. Loosen'
    WHEN name = 'Opus One' THEN 'Opus One Winery'
    WHEN name = 'Chablis Premier Cru' THEN 'William Fèvre'
    WHEN name = 'Amarone della Valpolicella' THEN 'Allegrini'
    ELSE 'Unknown Winery'
  END,
  price = CASE 
    WHEN name = 'Château Margaux' THEN 899.99
    WHEN name = 'Dom Pérignon' THEN 249.99
    WHEN name = 'Caymus Cabernet Sauvignon' THEN 89.99
    WHEN name = 'Sancerre Loire Valley' THEN 45.99
    WHEN name = 'Barolo Brunate' THEN 125.99
    WHEN name = 'Whispering Angel Rosé' THEN 24.99
    WHEN name = 'Riesling Kabinett' THEN 32.99
    WHEN name = 'Opus One' THEN 449.99
    WHEN name = 'Chablis Premier Cru' THEN 65.99
    WHEN name = 'Amarone della Valpolicella' THEN 89.99
    ELSE 35.99
  END,
  rating = CASE 
    WHEN name = 'Château Margaux' THEN 4.9
    WHEN name = 'Dom Pérignon' THEN 4.8
    WHEN name = 'Caymus Cabernet Sauvignon' THEN 4.5
    WHEN name = 'Sancerre Loire Valley' THEN 4.3
    WHEN name = 'Barolo Brunate' THEN 4.7
    WHEN name = 'Whispering Angel Rosé' THEN 4.2
    WHEN name = 'Riesling Kabinett' THEN 4.1
    WHEN name = 'Opus One' THEN 4.8
    WHEN name = 'Chablis Premier Cru' THEN 4.4
    WHEN name = 'Amarone della Valpolicella' THEN 4.6
    ELSE 4.0
  END,
  food_pairing = CASE 
    WHEN name = 'Château Margaux' THEN 'Grilled lamb, aged cheeses, dark chocolate'
    WHEN name = 'Dom Pérignon' THEN 'Oysters, caviar, lobster, celebration meals'
    WHEN name = 'Caymus Cabernet Sauvignon' THEN 'Grilled steak, BBQ ribs, aged cheddar'
    WHEN name = 'Sancerre Loire Valley' THEN 'Goat cheese, seafood, light salads'
    WHEN name = 'Barolo Brunate' THEN 'Truffle dishes, braised meats, aged parmesan'
    WHEN name = 'Whispering Angel Rosé' THEN 'Mediterranean cuisine, grilled fish, summer salads'
    WHEN name = 'Riesling Kabinett' THEN 'Spicy Asian cuisine, pork, fruit desserts'
    WHEN name = 'Opus One' THEN 'Prime rib, game meats, rich pasta dishes'
    WHEN name = 'Chablis Premier Cru' THEN 'Oysters, white fish, creamy sauces'
    WHEN name = 'Amarone della Valpolicella' THEN 'Braised beef, aged cheeses, chocolate desserts'
    ELSE 'Versatile food pairing'
  END,
  wine_image_name = CASE 
    WHEN type = 'red' THEN 'redwine_png/red_wine_' || (RANDOM() * 10)::int + 1 || '.png'
    WHEN type = 'white' THEN 'whitewine_png/white_wine_' || (RANDOM() * 10)::int + 1 || '.png'
    ELSE 'redwine_png/red_wine_1.png'
  END,
  url = CASE 
    WHEN name = 'Château Margaux' THEN 'https://www.chateau-margaux.com'
    WHEN name = 'Dom Pérignon' THEN 'https://www.domperignon.com'
    WHEN name = 'Caymus Cabernet Sauvignon' THEN 'https://www.caymus.com'
    WHEN name = 'Opus One' THEN 'https://www.opusonewinery.com'
    ELSE NULL
  END
WHERE id IN (
  SELECT id FROM wines LIMIT 10
);

-- Update wine types to only red and white as per requirements
UPDATE wines SET type = 'red' WHERE type IN ('rosé', 'sparkling', 'dessert');

-- Ensure alcohol_percentage is properly set
UPDATE wines SET alcohol_percentage = 
  CASE 
    WHEN alcohol_percentage IS NULL THEN 
      CASE 
        WHEN type = 'red' THEN 13.5 + (RANDOM() * 3)
        WHEN type = 'white' THEN 11.5 + (RANDOM() * 3)
        ELSE 12.5
      END
    ELSE alcohol_percentage
  END;