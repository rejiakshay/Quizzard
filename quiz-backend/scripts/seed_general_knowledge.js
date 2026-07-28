const prisma = require('../config/database');

const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };

// CSV data parsed inline — 5 sets of 10 questions each
const rows = [
  // Set 1
  { set: 1, q: "This is the only ancient wonder still standing today. For 3,800 years, it was the tallest man-made structure on Earth.", a: ["The Colossus of Rhodes","The Hanging Gardens of Babylon","The Lighthouse of Alexandria","The Great Pyramid of Giza"], ans: "D", fact: "The Great Pyramid was originally covered in polished white limestone that made it gleam in the sun - most of it was stripped away over centuries to build other structures." },
  { set: 1, q: "This structure is wrongly believed to be visible from space with the naked eye. Even the country's own first astronaut couldn't spot it from orbit.", a: ["The Great Wall of China","The Panama Canal","The Trans-Siberian Railway","The Suez Canal"], ans: "A", fact: "China's first astronaut, Yang Liwei, said in 2003 he couldn't see the Wall from orbit - and Apollo astronauts circling the Moon confirmed the same." },
  { set: 1, q: "This planet was recently found to have over 280 moons, more than any other in the solar system. Most are tiny, irregular chunks just a few kilometers wide.", a: ["Jupiter","Saturn","Uranus","Neptune"], ans: "B", fact: "Saturn's largest moon, Titan, is the only moon with a thick atmosphere and stable liquid lakes - just made of methane instead of water." },
  { set: 1, q: "This organ makes up 15% of an adult's body weight, the largest in the human body. It renews itself completely about once a month.", a: ["The liver","The small intestine","The lungs","The skin"], ans: "D", fact: "An adult's skin covers about 20 square feet and sheds roughly 500 million cells every day." },
  { set: 1, q: "This is the world's priciest spice by weight, sometimes costing more than gold. Each flower yields just three usable threads.", a: ["Saffron","Turmeric","Paprika","Sumac"], ans: "A", fact: "Saffron flowers must be hand-picked within hours of opening - they wilt almost immediately, so roughly 150,000 blooms go into just one kilogram." },
  { set: 1, q: "This is the solar system's hottest planet, despite not being closest to the sun. A runaway greenhouse effect traps heat in its thick atmosphere.", a: ["Mercury","Mars","Venus","Jupiter"], ans: "C", fact: "Venus's surface is hot enough to melt lead, at around 465 degrees C (869 degrees F)." },
  { set: 1, q: "This creature can throw a punch as fast as a .22-caliber bullet, strong enough to shatter aquarium glass. It's a small, colorful crustacean, not a boxer.", a: ["Pistol shrimp","Fiddler crab","Blue-ringed octopus","Mantis shrimp"], ans: "D", fact: "The strike is so fast it makes the water around it flash-boil for an instant, a phenomenon called cavitation." },
  { set: 1, q: "This language has more native speakers than any other on Earth, more than triple English's count. It also has no alphabet - just thousands of characters.", a: ["Hindi","Spanish","Mandarin Chinese","English"], ans: "C", fact: "Mandarin is tonal - the same syllable 'ma' can mean mother, hemp, horse, or a scolding, depending on pitch alone." },
  { set: 1, q: "This is technically the world's largest lake, despite being called a 'sea' with salty water. It's landlocked, bordered by countries across Europe and Asia.", a: ["The Dead Sea","The Caspian Sea","The Aral Sea","Lake Baikal"], ans: "B", fact: "The Caspian Sea is larger than the entire country of Germany." },
  { set: 1, q: "This trophy is deliberately made without a lid, and winners often eat or drink from it. Every player on the winning team gets their name engraved on it.", a: ["The Stanley Cup","The Ashes","The FA Cup","The America's Cup"], ans: "A", fact: "It's the same physical trophy passed on each year, not remade - and it's been used as everything from a cereal bowl to a baptismal font." },

  // Set 2
  { set: 2, q: "This is recorded as the shortest war in history, lasting well under an hour. It broke out in East Africa in 1896 over a disputed succession to a throne.", a: ["The Football War","The Six-Day War","The Anglo-Zanzibar War","The Toledo War"], ans: "C", fact: "The war lasted just 38 minutes - mostly a British naval bombardment of the sultan's palace, which ended when the sultan slipped out a back door." },
  { set: 2, q: "This university has been teaching students since before the Aztec Empire even existed. It's the oldest university in the English-speaking world, though its exact founding date is unknown.", a: ["Cambridge University","University of Oxford","University of Bologna","Harvard University"], ans: "B", fact: "Teaching at Oxford dates back to at least 1096 - making it roughly 500 years older than Harvard, the oldest university in the US." },
  { set: 2, q: "This sea creature has three hearts, though one of them stops beating whenever it swims. Its blood also runs blue instead of red.", a: ["Squid","Cuttlefish","Nautilus","Octopus"], ans: "D", fact: "Because swimming shuts down that heart and tires them out fast, octopuses usually prefer crawling along the seafloor instead." },
  { set: 2, q: "This animal can freeze completely solid in winter, with its heart stopping for months at a time. Come spring, it simply thaws out and hops away unharmed.", a: ["Wood frog","Arctic ground squirrel","Painted turtle","Common toad"], ans: "A", fact: "It survives by flooding its body with glucose, a natural antifreeze that keeps ice from forming inside its cells even as the rest of it freezes solid." },
  { set: 2, q: "This food never spoils if sealed properly - archaeologists have found 3,000-year-old jars of it in Egyptian tombs that are still edible. Its low moisture and acidity make it almost impossible for bacteria to survive in it.", a: ["Salt","Rice","Honey","Dried dates"], ans: "C", fact: "It's also been used to treat wounds since ancient times, since the same properties that stop it from spoiling also kill bacteria on contact." },
  { set: 2, q: "This product was invented almost by accident by a company accountant tinkering in his spare time. Its signature color exists only because pink was the one food dye he had on hand.", a: ["Marshmallows","Bubble gum","Popsicles","Cotton candy"], ans: "B", fact: "Walter Diemer invented it in 1928 with no scientific training - his first batch sold out within a day of hitting stores." },
  { set: 2, q: "This landmark grows several centimeters taller in summer, purely because heat expands its iron frame. It shrinks back down again once winter arrives.", a: ["Big Ben","The Statue of Liberty","The Empire State Building","The Eiffel Tower"], ans: "D", fact: "Uneven heating can also make it lean slightly away from the sun, since the sun-facing side expands more than the shaded side." },
  { set: 2, q: "This is the largest living structure on Earth, so vast it's the only one visible from space. It isn't a single organism, but billions of tiny coral creatures built up over thousands of years.", a: ["The Great Barrier Reef","The Amazon Rainforest","The Sahara Desert","The Congo Rainforest"], ans: "A", fact: "It stretches over 2,300 km along Australia's coast and is actually made up of nearly 3,000 separate reefs, not one continuous structure." },
  { set: 2, q: "This bird isn't naturally pink - it's born gray, and only turns color because of pigments in its diet. Change its food, and its feathers can fade back toward white.", a: ["Roseate spoonbill","Scarlet ibis","Flamingo","Pink pigeon"], ans: "C", fact: "The pink comes from carotenoid pigments in the algae and shrimp it eats - zookeepers add supplements to keep captive flamingos vividly colored." },
  { set: 2, q: "This popular fruit is botanically classified as a true berry, while strawberries technically aren't. Its plant is actually the world's largest herb, not a tree.", a: ["Mango","Banana","Coconut","Apple"], ans: "B", fact: "True berries form from a single ovary with seeds embedded in the flesh - bananas qualify, but strawberries' seeds sit on the outside, so they don't count botanically." },

  // Set 3
  { set: 3, q: "This place has footprints from over 50 years ago that could still last millions of years. There's no wind or water there to wear them away.", a: ["Mars","The Moon","Mercury","Venus"], ans: "B", fact: "Apollo astronaut footprints from 1969 are expected to remain largely intact for tens of millions of years, worn down only very slowly by tiny space rock impacts." },
  { set: 3, q: "This organ produces acid strong enough to dissolve metal over time, yet it never digests itself. It replaces its inner lining every few days to protect against its own acid.", a: ["The liver","The small intestine","The pancreas","The stomach"], ans: "D", fact: "Stomach acid is roughly as strong as battery acid, but a constantly renewed layer of mucus keeps it from eating through the stomach wall." },
  { set: 3, q: "This tiny eight-legged creature can survive being frozen, dried out completely, boiled, and even exposed to the vacuum of outer space. It's nicknamed after a bear because of its slow, lumbering crawl.", a: ["Tardigrade","Rotifer","Brine shrimp","Nematode"], ans: "A", fact: "In 2007, scientists sent dehydrated tardigrades into open space for ten days, and many came back to life after being rehydrated on Earth." },
  { set: 3, q: "This mountain is taller than Mount Everest when measured from base to peak rather than from sea level. Most of its height is hidden underwater.", a: ["K2","Denali","Mauna Kea","Kilimanjaro"], ans: "C", fact: "Only about 4,200 meters of it rises above sea level, but including its underwater base, it stretches over 10,000 meters tall - more than a kilometer taller than Everest." },
  { set: 3, q: "This kitchen tool wasn't invented until roughly 50 years after the item it's meant to open. Before it existed, people used a hammer and chisel instead.", a: ["Bottle opener","Can opener","Corkscrew","Jar lid opener"], ans: "B", fact: "Instructions printed on early tin cans literally read 'cut round the top near the outer edge with a chisel and hammer,' since a dedicated opener didn't exist yet." },
  { set: 3, q: "This prize is required to be made mostly of silver, with only a thin layer of another precious metal on top. It hasn't been made entirely of that metal in over a century.", a: ["Grammy Award","Academy Award (Oscar)","Nobel Prize medal","Olympic gold medal"], ans: "D", fact: "Olympic rules require gold medals to contain at least 92.5% silver, plated with just six grams of actual gold - the last solid gold medals were awarded back in 1912." },
  { set: 3, q: "This condiment was once sold in pill form as medicine in the 1830s, marketed as a cure for indigestion and jaundice. A doctor's endorsement briefly made it more popular as medicine than as food.", a: ["Ketchup","Mustard","Mayonnaise","Vinegar"], ans: "A", fact: "The trend collapsed by 1850 after companies got caught disguising laxatives as 'tomato pills,' and it took decades to reappear as a table condiment." },
  { set: 3, q: "This material is often called a slow-moving liquid, with old windows being thicker at the bottom cited as proof. Scientists have thoroughly debunked the idea using physics calculations.", a: ["Ice","Wax","Glass","Plastic"], ans: "C", fact: "Old windows are actually uneven because medieval glassmakers couldn't produce perfectly flat panes, so installers placed the thicker edge at the bottom for stability." },
  { set: 3, q: "This is the largest animal to have ever lived, even bigger than any dinosaur. Its heart alone weighs as much as a small car.", a: ["Sperm whale","Blue whale","Fin whale","Whale shark"], ans: "B", fact: "Its main artery is wide enough to fit a person's head through, though a full-grown adult couldn't actually crawl through it as a popular myth claims." },
  { set: 3, q: "This everyday piece of technology was first built just so researchers could check whether a coffee pot in another room was full. It's considered the earliest device of its kind ever connected to the internet.", a: ["Smartwatch","Wi-Fi router","Bluetooth headset","Webcam"], ans: "D", fact: "The famous 'Trojan Room coffee pot' camera at Cambridge University ran from 1991 to 2001, and by the end, people worldwide were tuning in just to watch a coffee pot." },

  // Set 4
  { set: 4, q: "This predator has been swimming in Earth's oceans for hundreds of millions of years, predating trees, dinosaurs, and even Saturn's rings. It has survived five mass extinctions since it first appeared.", a: ["Shark","Crocodile","Turtle","Coelacanth"], ans: "A", fact: "Sharks evolved roughly 400-450 million years ago - tens of millions of years before the first trees existed on land." },
  { set: 4, q: "This spice was once so valuable that the Dutch traded away the island of Manhattan just to gain full control of the tiny island where it grew. A 1667 treaty sealed the unlikely swap.", a: ["Cinnamon","Nutmeg","Cloves","Saffron"], ans: "B", fact: "The Dutch handed Manhattan to the British in exchange for Run Island in Indonesia, believing they'd gotten the better deal by cornering the world's nutmeg supply." },
  { set: 4, q: "This object appears yellow from Earth's surface, but astronauts who've seen it from space describe it as pure white. Earth's atmosphere is what adds the yellow tint.", a: ["The Moon","Mars","The Sun","Venus"], ans: "C", fact: "The Sun looks yellow because our atmosphere scatters away blue light before it reaches our eyes - the same effect that makes the sky blue." },
  { set: 4, q: "This carnivorous plant requires its trigger hairs to be touched twice within about 20 seconds before it snaps shut. A single touch alone won't trigger it, avoiding wasted energy on false alarms.", a: ["Pitcher plant","Sundew","Bladderwort","Venus flytrap"], ans: "D", fact: "Scientists have found the plant can essentially 'count' touches - it needs a specific number of triggers before it even starts producing digestive enzymes." },
  { set: 4, q: "This keyboard layout wasn't designed for speed or comfort - it was arranged in the 1870s to keep mechanical arms on early typewriters from jamming together. It has stuck around long after the problem it solved disappeared.", a: ["QWERTY layout","Dvorak layout","Braille keyboard","Morse code key"], ans: "A", fact: "Commonly used letter pairs were deliberately placed far apart to slow the mechanical clash of typebars - a problem that hasn't existed for over a century." },
  { set: 4, q: "This ancient building material has survived direct exposure to seawater for over 2,000 years, while its modern equivalent can crumble within decades. Scientists only recently figured out its self-healing secret.", a: ["Egyptian mortar","Roman concrete","Greek marble","Mesopotamian brick"], ans: "B", fact: "Small lime lumps in the mix react with water seeping into cracks, growing new minerals that reseal the damage - a kind of built-in repair system." },
  { set: 4, q: "This volcanic eruption in 1883 produced the loudest sound ever recorded, estimated at 310 decibels. It was clearly heard roughly 3,000 miles away.", a: ["Mount Vesuvius","Mount Tambora","Krakatoa","Mount St. Helens"], ans: "C", fact: "The pressure wave from the explosion was powerful enough to circle the entire Earth multiple times, registering on barometers around the world." },
  { set: 4, q: "This bird can recognize individual human faces and hold onto grudges against specific people for years. It can even teach other members of its species to fear the same person.", a: ["Pigeon","Seagull","Sparrow","Crow"], ans: "D", fact: "In one famous study, researchers wore a mask while temporarily capturing crows for tagging - years later, crows still scolded anyone wearing that same mask on sight." },
  { set: 4, q: "This drink is bottled under pressure roughly two to three times higher than what's inside a standard car tire. That's why its bottles are made with especially thick glass.", a: ["Champagne","Beer","Soda water","Kombucha"], ans: "A", fact: "The pressure comes from a second round of fermentation that happens right inside the sealed bottle, trapping carbon dioxide that would otherwise escape." },
  { set: 4, q: "This toy was accidentally created during World War II while a scientist was trying to invent a cheap substitute for rubber. The military had no use for it, so it eventually became a children's toy instead.", a: ["Play-Doh","Silly Putty","Slinky","Rubik's Cube"], ans: "B", fact: "It was originally sold in plastic eggs around Easter in 1950, and orders topped 250,000 within just three days of a magazine article about it." },

  // Set 5
  { set: 5, q: "This island was deliberately given an appealing name by the Viking explorer who found it, even though it was covered mostly in ice. He hoped the name would attract more settlers.", a: ["Iceland","Svalbard","Greenland","Newfoundland"], ans: "C", fact: "Erik the Red named it Greenland around 1000 AD purely as a marketing move - and it worked, drawing hundreds of Norse settlers to the icy island." },
  { set: 5, q: "This marine mammal often holds paws with others of its kind while sleeping, so the group doesn't drift apart in the ocean currents. It's also one of the few animals known to use tools.", a: ["Seal","Dolphin","Manatee","Sea otter"], ans: "D", fact: "Sea otters keep a favorite rock tucked in a pouch of loose skin under their forearm, using it for years to crack open shellfish." },
  { set: 5, q: "This product was inspired by tiny hooked seeds that kept sticking to a Swiss engineer's dog after a walk in the woods. Studying them under a microscope led to a whole new type of fastener.", a: ["Velcro","Zipper","Snap button","Safety pin"], ans: "A", fact: "The engineer, George de Mestral, spent nearly a decade perfecting the design before it was patented in 1955." },
  { set: 5, q: "This eating utensil wasn't originally meant for eating at all - it was first used as a cooking tool to stir pots and pull food from boiling water. It only became a table utensil centuries later.", a: ["Fork","Chopsticks","Spoon","Skewer"], ans: "B", fact: "The switch to eating with them is linked to a population boom in ancient China that forced cooks to conserve fuel by chopping food small - which also made knives unnecessary at the table." },
  { set: 5, q: "This place is technically the largest desert on Earth, even though it's covered in ice rather than sand. Deserts are defined by how little precipitation falls, not by temperature.", a: ["The Sahara","The Gobi","Antarctica","The Arabian Desert"], ans: "C", fact: "Some interior valleys of Antarctica haven't seen rain or snow in millions of years, making them far drier than most sandy deserts." },
  { set: 5, q: "This region was once a lush landscape of lakes and grassland roamed by hippos, giraffes, and elephants, as recently as a few thousand years ago. Ancient rock art found there still depicts this vanished world.", a: ["The Gobi Desert","The Arabian Desert","The Kalahari Desert","The Sahara Desert"], ans: "D", fact: "This 'Green Sahara' period lasted roughly from 11,000 to 5,000 years ago, driven by shifts in Earth's orbit that brought heavier monsoon rains to North Africa." },
  { set: 5, q: "This popular drink's original 1886 recipe contained an extract from the same plant used to make cocaine. The ingredient was phased out of the formula by the early 1900s.", a: ["Coca-Cola","Pepsi","Dr Pepper","Root beer"], ans: "A", fact: "The drink's name itself nods to two of its original ingredients - coca leaves and kola nuts, the latter providing caffeine." },
  { set: 5, q: "This medicine was discovered by accident when a scientist noticed mold had contaminated one of his petri dishes and killed the bacteria around it. It went on to save millions of lives.", a: ["Aspirin","Penicillin","Insulin","Morphine"], ans: "B", fact: "Alexander Fleming almost threw out the contaminated dish in 1928 before noticing the bacteria-free ring around the mold." },
  { set: 5, q: "This office product exists because a scientist trying to invent a super-strong adhesive accidentally created one that was weak and barely sticky instead. A colleague later found the perfect use for it.", a: ["Sticky tape","Masking tape","Post-it Notes","Rubber cement"], ans: "C", fact: "Spencer Silver invented the weak adhesive in 1968, but it took another 3M scientist, Art Fry, using it to bookmark his hymnal, to realize its real potential." },
  { set: 5, q: "This popular snack is often called a nut, but it's actually part of the same plant family as peas and beans. Unlike true nuts, it grows underground rather than on a tree.", a: ["Cashew","Almond","Pistachio","Peanut"], ans: "D", fact: "True tree nuts like almonds and pistachios grow above ground, while peanuts develop underground after their flower stems bury themselves into the soil - a process called 'pegging.'" },
];

async function main() {
  // Group by set number
  const sets = {};
  for (const row of rows) {
    if (!sets[row.set]) sets[row.set] = [];
    sets[row.set].push(row);
  }

  for (const [setNum, questions] of Object.entries(sets)) {
    const title = `General Knowledge · Set ${setNum}`;
    const description = `General knowledge quiz · Set ${setNum} · 10 questions`;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        tag: 'General',
        difficulty: 'medium',
        isPublished: true,
        questions: {
          create: questions.map((row, i) => {
            const correctIdx = ANSWER_MAP[row.ans];
            return {
              questionText: row.q,
              order: i + 1,
              funFact: row.fact,
              options: {
                create: row.a.map((text, j) => ({
                  text,
                  isCorrect: j === correctIdx,
                })),
              },
            };
          }),
        },
      },
    });

    console.log(`✓ Created "${quiz.title}" (id ${quiz.id})`);
  }

  console.log('\nDone — 5 General Knowledge quiz sets added.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
