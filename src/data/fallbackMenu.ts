export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  foodType: 'VEG' | 'NON_VEG';
  isAvailable: boolean;
  preparationMinutes?: number;
  isBestseller?: boolean;
  isFeatured?: boolean;
  variants?: { id: string; name: string; price: number; isDefault?: boolean }[];
  menuItemAddonGroups?: any[];
}

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
  menuItems: MenuItemData[];
}

export const FALLBACK_CATEGORIES: CategoryData[] = [
  {
    id: "cat-coffee",
    name: "Specialty Coffee",
    description: "Single-origin beans roasted in-house with certified Barista craftsmanship",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=75",
    sortOrder: 1,
    menuItems: [
      {
        id: "item-flat-white",
        name: "Nordic Flat White",
        description: "Velvety micro-foam poured over a double ristretto blend of Ethiopian Yirgacheffe with notes of jasmine, bergamot, and sweet stone fruit.",
        basePrice: 169,
        image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 4,
        variants: [
          { id: "var-fw-reg", name: "Regular (240ml)", price: 169, isDefault: true },
          { id: "var-fw-lrg", name: "Grande (360ml)", price: 209, isDefault: false }
        ]
      },
      {
        id: "item-cappuccino",
        name: "Classic Creamy Cappuccino",
        description: "Rich espresso balanced with equal parts steamed whole milk and deep velvety milk foam, dusted with 70% raw cocoa powder.",
        basePrice: 149,
        image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 4,
        variants: [
          { id: "var-cap-std", name: "Standard (220ml)", price: 149, isDefault: true },
          { id: "var-cap-lrg", name: "Large (320ml)", price: 189, isDefault: false }
        ]
      },
      {
        id: "item-spanish-latte",
        name: "Iced Spanish Cold Brew Latte",
        description: "18-hour slow-steeped cold brew infused with sweetened condensed milk, fresh whole milk, and poured over crystal clear ice.",
        basePrice: 199,
        image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 3,
        variants: [
          { id: "var-sp-std", name: "Standard (350ml)", price: 199, isDefault: true },
          { id: "var-sp-lrg", name: "Large (500ml)", price: 239, isDefault: false }
        ]
      },
      {
        id: "item-pour-over",
        name: "Single-Origin Pour Over (V60 / Chemex)",
        description: "Artisan hand-brewed Colombian Geisha micro-lot with extraordinary clarity, floral aromatics, bright citrus acidity, and honey finish.",
        basePrice: 219,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 6,
        variants: [
          { id: "var-po-v60", name: "V60 Drip (250ml)", price: 219, isDefault: true },
          { id: "var-po-chx", name: "Chemex Lab (400ml)", price: 289, isDefault: false }
        ]
      },
      {
        id: "item-cortado",
        name: "Salted Butterscotch Cortado",
        description: "Equal parts rich espresso and silky warm milk infused with our house-crafted salted butterscotch caramel and smoked sea salt.",
        basePrice: 179,
        image: "https://images.unsplash.com/photo-1585494156145-1c60a4fe9d2b?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 4
      },
      {
        id: "item-cold-drip",
        name: "Kyoto Slow Cold Drip Reserve",
        description: "Extracted drop by drop over 12 hours through our Japanese glass tower. Complex notes of dark molasses, bourbon vanilla, and dark cherry.",
        basePrice: 229,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 2
      }
    ]
  },
  {
    id: "cat-sourdough",
    name: "Artisan Sourdough & Toasts",
    description: "Handcrafted 36-hour cold fermented sourdough baked fresh daily on stone hearths",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=300&q=75",
    sortOrder: 2,
    menuItems: [
      {
        id: "item-avo-egg",
        name: "Avocado & Truffled Poached Eggs Sourdough",
        description: "Thick-cut country sourdough, creamy Hass avocado smash, two pasture-raised poached eggs, chili crunch oil, and microgreens.",
        basePrice: 329,
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 10
      },
      {
        id: "item-salmon-tartine",
        name: "Nordic Smoked Salmon & Dill Tartine",
        description: "Cured Norwegian salmon slices, whipped cream cheese, caper berries, pickled red shallots, and fresh garden dill on toasted dark rye sourdough.",
        basePrice: 429,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 8
      },
      {
        id: "item-burrata-toast",
        name: "Whipped Burrata & Roasted Fig Toast",
        description: "Creamy artisanal burrata, aged Modena balsamic reduction, caramelized black mission figs, roasted walnuts, and wildflower honey on sourdough.",
        basePrice: 369,
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 8
      },
      {
        id: "item-garlic-mushroom",
        name: "Confit Garlic & Wild Mushroom Tartine",
        description: "Sautéed forest shiitake and oyster mushrooms, slow-confit garlic butter, fresh thyme sprigs, and shaved 24-month Parmigiano Reggiano.",
        basePrice: 319,
        image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 9
      },
      {
        id: "item-hot-honey-ricotta",
        name: "Hot Honey Ricotta & Toasted Almond Toast",
        description: "Hand-dipped fresh whole milk ricotta, chili-infused organic wildflower hot honey, toasted flaked almonds, and sea salt flakes.",
        basePrice: 289,
        image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 6
      },
      {
        id: "item-prosciutto-toast",
        name: "Prosciutto Crudo & Heirloom Tomato Toast",
        description: "24-month aged San Daniele prosciutto, vine-ripened heirloom tomatoes, Genoa basil pesto, cold-pressed olive oil, and burrata cream.",
        basePrice: 399,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 8
      }
    ]
  },
  {
    id: "cat-pizza",
    name: "Woodfired Artisan Pizza",
    description: "48-hour fermented sourdough crust baked at 450°C with San Marzano tomatoes & fior di latte",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=75",
    sortOrder: 3,
    menuItems: [
      {
        id: "item-margherita",
        name: "Margherita Con Bufala D.O.P.",
        description: "Crushed San Marzano tomato sauce, fresh Italian buffalo mozzarella, torn sweet basil leaves, and cold-pressed extra virgin olive oil.",
        basePrice: 389,
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 12,
        variants: [
          { id: "var-mrg-10", name: "10-inch Personal", price: 389, isDefault: true },
          { id: "var-mrg-12", name: "12-inch Sharing", price: 499, isDefault: false }
        ]
      },
      {
        id: "item-truffle-pizza",
        name: "Black Truffle & Shiitake Mushroom",
        description: "White garlic cream base, sautéed forest shiitake and button mushrooms, fior di latte, white truffle oil drizzle, and shaved pecorino.",
        basePrice: 479,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 14,
        variants: [
          { id: "var-trf-10", name: "10-inch Personal", price: 479, isDefault: true },
          { id: "var-trf-12", name: "12-inch Sharing", price: 599, isDefault: false }
        ]
      },
      {
        id: "item-pepperoni-pizza",
        name: "Rustic Pork Pepperoni & Hot Honey",
        description: "Slow-cured artisanal spicy pork pepperoni slices crisped to perfection over fresh mozzarella, oregano, and drizzled with hot honey.",
        basePrice: 529,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 14,
        variants: [
          { id: "var-pep-10", name: "10-inch Personal", price: 529, isDefault: true },
          { id: "var-pep-12", name: "12-inch Sharing", price: 649, isDefault: false }
        ]
      },
      {
        id: "item-quattro-formaggi",
        name: "Quattro Formaggi Bianco",
        description: "Creamy four-cheese blend of Gorgonzola dolce, fontina, smoked scamorza, and aged parmigiano with fresh rosemary sprigs.",
        basePrice: 469,
        image: "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 12,
        variants: [
          { id: "var-qf-10", name: "10-inch Personal", price: 469, isDefault: true },
          { id: "var-qf-12", name: "12-inch Sharing", price: 589, isDefault: false }
        ]
      },
      {
        id: "item-chicken-pizza",
        name: "Spiced Roast Chicken & Charred Peppers",
        description: "Herb-marinated roasted chicken breast chunks, charred fire-roasted bell peppers, red onions, smoked scamorza, and spicy arrabbiata tomato sauce.",
        basePrice: 489,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 14,
        variants: [
          { id: "var-chk-10", name: "10-inch Personal", price: 489, isDefault: true },
          { id: "var-chk-12", name: "12-inch Sharing", price: 619, isDefault: false }
        ]
      },
      {
        id: "item-lamb-pizza",
        name: "Smoked Lamb Merguez & Caramelized Onion",
        description: "House-ground spiced lamb merguez sausage, slow-caramelized balsamic onions, Greek feta crumble, and fresh garden mint leaves.",
        basePrice: 549,
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 15,
        variants: [
          { id: "var-lmb-10", name: "10-inch Personal", price: 549, isDefault: true },
          { id: "var-lmb-12", name: "12-inch Sharing", price: 679, isDefault: false }
        ]
      }
    ]
  },
  {
    id: "cat-bakery",
    name: "Hearth Bakery & Pastries",
    description: "Oven-fresh French Viennoiserie, laminated croissants & traditional Scandinavian bakes",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=75",
    sortOrder: 4,
    menuItems: [
      {
        id: "item-cardamom-bun",
        name: "Cardamom Cinnamon Knot (Kardemummabulle)",
        description: "Authentic Swedish braided butter bun infused with freshly crushed green cardamom, cinnamon brown sugar swirl, and pearl sugar.",
        basePrice: 179,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 2
      },
      {
        id: "item-croissant",
        name: "Traditional French Butter Croissant",
        description: "72-layer laminated AOP French Normandy butter pastry, deeply caramelized flaky golden exterior with honeycomb interior.",
        basePrice: 149,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 2
      },
      {
        id: "item-pain-au-chocolat",
        name: "Double Valrhona Pain au Chocolat",
        description: "Flaky French puff pastry generously filled with two batons of melted Valrhona 70% dark single-origin French chocolate.",
        basePrice: 189,
        image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 2
      },
      {
        id: "item-blueberry-danish",
        name: "Blueberry & Vanilla Frangipane Danish",
        description: "Handmade puff pastry nest filled with almond frangipane cream, simmered wild blueberries, and light lemon sugar glaze.",
        basePrice: 219,
        image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 2
      },
      {
        id: "item-almond-croissant",
        name: "Almond Flaked Twice-Baked Croissant",
        description: "Classic croissant soaked in Tahitian vanilla bean syrup, stuffed with velvety almond crème patissiere and toasted flaked almonds.",
        basePrice: 229,
        image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 2
      },
      {
        id: "item-morning-bun",
        name: "Sourdough Morning Bun with Orange Zest",
        description: "Rolled sourdough pastry filled with brown butter, Saigon cinnamon, and freshly zested Valencia orange sugar with crispy caramelized edges.",
        basePrice: 199,
        image: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 2
      }
    ]
  },
  {
    id: "cat-burgers",
    name: "Gourmet Burgers & Melts",
    description: "House-ground patties, melted artisan cheeses & house pickles on toasted brioche or sourdough",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=75",
    sortOrder: 5,
    menuItems: [
      {
        id: "item-smash-burger",
        name: "Smoked Cheddar Double Smash Burger",
        description: "Double smashed tenderloin patties with seared crispy lacy edges, double vintage cheddar, secret Nordic burger sauce, and house pickles on brioche.",
        basePrice: 349,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 12
      },
      {
        id: "item-chicken-burger",
        name: "Crispy Buttermilk Chicken Brioche",
        description: "24-hour spiced buttermilk brined crispy chicken thigh, creamy pickled jalapeno slaw, hot honey drizzle, and roasted garlic aioli.",
        basePrice: 329,
        image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 12
      },
      {
        id: "item-portobello-melt",
        name: "Truffle Portobello & Gouda Melt",
        description: "Marinated grilled whole portobello mushroom cap, aged Dutch smoked gouda, balsamic caramelized onions, and white truffle crema on sourdough.",
        basePrice: 319,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 10
      },
      {
        id: "item-jackfruit-burger",
        name: "Pulled BBQ Jackfruit & Slaw Brioche",
        description: "Slow-braised young jackfruit simmered in our smoky chipotle BBQ reduction, crisp purple cabbage slaw, and vegan garlic emulsion.",
        basePrice: 299,
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 10
      },
      {
        id: "item-turkey-club",
        name: "Smoked Bacon & Roast Turkey Club Melt",
        description: "Crisp maple glazed bacon, herb roasted turkey breast, melted gruyere cheese, sun-dried tomato aioli, and baby spinach on sourdough.",
        basePrice: 369,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 12
      },
      {
        id: "item-halloumi-burger",
        name: "Grilled Halloumi & Avocado Brioche",
        description: "Golden pan-seared Cypriot halloumi cheese slabs, ripe avocado smash, spicy heirloom tomato relish, and baby arugula on toasted milk brioche.",
        basePrice: 329,
        image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 10
      }
    ]
  },
  {
    id: "cat-bowls",
    name: "Nordic Bowls & Salads",
    description: "Wholesome, colorful grain bowls & garden-fresh salads packed with superfood nutrients",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=75",
    sortOrder: 6,
    menuItems: [
      {
        id: "item-salmon-bowl",
        name: "Nordic Gravlax Salmon & Quinoa Bowl",
        description: "Beetroot-cured salmon ribbons, tricolor organic quinoa, edamame beans, pickled Persian cucumber ribbons, avocado, and sweet dill mustard vinaigrette.",
        basePrice: 449,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 8
      },
      {
        id: "item-caesar-salad",
        name: "Charred Broccoli & Avocado Caesar Salad",
        description: "Tenderstem charred broccoli florets, baby cos lettuce, sliced avocado, sourdough garlic croutons, shaved parmesan, and creamy caesar dressing.",
        basePrice: 329,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 7
      },
      {
        id: "item-pumpkin-salad",
        name: "Roasted Pumpkin & Goat Cheese Salad",
        description: "Maple-roasted butternut squash chunks, creamy Chevre goat cheese crumbles, baby spinach, toasted pumpkin seeds, and apple cider dressing.",
        basePrice: 349,
        image: "https://images.unsplash.com/photo-1505253758473-96b3d5ebcd96?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 8
      },
      {
        id: "item-turmeric-tofu-bowl",
        name: "Golden Turmeric Tofu & Brown Rice Bowl",
        description: "Pan-seared turmeric tofu cubes, warm steamed brown rice, edamame, shredded purple cabbage, avocado, and creamy ginger tahini dressing.",
        basePrice: 319,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 8
      },
      {
        id: "item-chicken-quinoa-salad",
        name: "Smoked Chicken & Quinoa Superfood Salad",
        description: "Herbed grilled chicken breast slices, tricolor quinoa, pomegranate pearls, baby kale leaves, crumbled feta, and fresh lemon herb dressing.",
        basePrice: 389,
        image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=300&q=75",
        foodType: "NON_VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 9
      }
    ]
  },
  {
    id: "cat-coolers",
    name: "Coolers & Tonics",
    description: "Sparkling house-crafted botanical coolers, fruit tonics & artisanal live kombuchas",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=75",
    sortOrder: 7,
    menuItems: [
      {
        id: "item-berry-hibiscus",
        name: "Wild Berry & Hibiscus Iced Brew",
        description: "Brewed Egyptian hibiscus petals with wild raspberries, crushed mint leaves, organic raw cane sugar, and sparkling mineral water.",
        basePrice: 179,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 3
      },
      {
        id: "item-yuzu-lemonade",
        name: "Sparkling Yuzu & Rosemary Lemonade",
        description: "Japanese yuzu citrus juice, cold-pressed lemon juice, organic agave, sparkling soda, and an aromatic scorched rosemary sprig.",
        basePrice: 189,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 3
      },
      {
        id: "item-kombucha",
        name: "Elderflower & White Peach Kombucha",
        description: "Small-batch live fermented green tea kombucha infused with English elderflower blossoms and sweet white peach nectar.",
        basePrice: 219,
        image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 2
      },
      {
        id: "item-matcha-latte",
        name: "Kyoto Ceremonial Iced Matcha Latte",
        description: "Stone-ground ceremonial grade Uji matcha whisked with oat milk, Madagascar vanilla syrup, and poured over clear ice cubes.",
        basePrice: 229,
        image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 4
      },
      {
        id: "item-cucumber-tonic",
        name: "Cucumber Mint Botanical Tonic",
        description: "Muddled Persian cucumbers, bruised sweet garden mint, tonic water reduction, lime juice, and crushed ice.",
        basePrice: 169,
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 3
      }
    ]
  },
  {
    id: "cat-desserts",
    name: "Decadent Desserts",
    description: "Handcrafted European confections, artisan cheesecakes & molten chocolate bakes",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=75",
    sortOrder: 8,
    menuItems: [
      {
        id: "item-tiramisu",
        name: "Classic Espresso Tiramisu",
        description: "Savoiardi ladyfingers soaked in our signature house espresso and coffee liqueur, layered with velvety mascarpone cream and Valrhona cocoa.",
        basePrice: 269,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 3
      },
      {
        id: "item-cheesecake",
        name: "Lotus Biscoff Baked Cheesecake",
        description: "Decadent Philadelphia cream cheese cake on a spiced Lotus biscuit crust, crowned with melted Biscoff spread and crushed cookie crumb.",
        basePrice: 249,
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: true,
        preparationMinutes: 3
      },
      {
        id: "item-kladdkaka",
        name: "Swedish Kladdkaka (Gooey Molten Chocolate)",
        description: "Classic Swedish fudgy chocolate cake with an intensely gooey molten center, served with whipped Madagascar vanilla bean chantilly cream.",
        basePrice: 239,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 5
      },
      {
        id: "item-chocolate-tart",
        name: "Dark Chocolate & Sea Salt Ganache Tart",
        description: "72% single-origin dark chocolate silk ganache in a crisp French butter sable tart shell, finished with flaky Maldon sea salt crystals.",
        basePrice: 259,
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 3
      },
      {
        id: "item-apple-crumble",
        name: "Warm Apple Blackberry Sourdough Crumble",
        description: "Himachal apples and wild blackberries spiced with cinnamon, baked under a golden sourdough oat-pecan crumble, served with vanilla bean gelato.",
        basePrice: 249,
        image: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=300&q=75",
        foodType: "VEG",
        isAvailable: true,
        isBestseller: false,
        preparationMinutes: 6
      }
    ]
  }
];
