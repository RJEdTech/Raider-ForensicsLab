/* f1.js */
BioLab.addPractical({
crimescene: {
  hook: 'Four of you must search a 9 m × 6.6 m chemistry room full of lab benches after a break-in. A line search takes about 6 minutes; a zone search takes about 24. Which do you choose, and what does the faster one cost you?',
  answer: 'The line search finds 6 of the 11 items in about 6 minutes. The zone search finds 10 of 11 in about 24 minutes (about 95 person-minutes). The benches break up the line search’s lanes, so items under and around furniture get missed. Once the scene is released, missed evidence is gone, so the zone search is worth the time.',
  uses: [
    'Avalanche rescue: probers stand shoulder to shoulder and step forward in a line. A line search works on an open slope, the opposite of a classroom full of benches.',
    'Evidence rooms: damp clothing is air-dried and packed in paper bags, because in plastic the trapped moisture lets mold and bacteria break down the DNA.',
    'Court: every person who handles an item signs a chain-of-custody form. An unexplained gap lets the defense argue the evidence was changed.'
  ],
  takeaway: 'A fast search that misses evidence is the slowest kind, because you cannot go back once the scene is released. In a cluttered space, split it into small zones and search each one closely. It works for lost keys too.',
  tour: [
    'Someone broke into a chemistry room overnight, and no one was hurt. First the scene is secured: one way in and out, a log of everyone who enters, and nothing touched until it has been recorded.',
    'Every contact leaves a trace. This is Locard’s exchange principle. The intruder left things behind (prints, fibers, blood, a water bottle) and carried things away (glass, powder) on shoes and clothes. The search looks for both.',
    'In a line search, four searchers walk side by side across the room, like a team sweeping a field. It is fast, but lab benches break up the lanes, so items under furniture or on the cabinet get only a quick look.',
    'A zone search splits the room into sections and searches each one in close lanes, the way you hunt for lost earbuds one room at a time. It takes more person-minutes but finds much more. Compare the counts in the evidence log.',
    'Each item is photographed three ways (the whole room, mid-range, and a close-up with a ruler) and measured on a sketch, so anyone can find its spot months later in court. The bottle is located by a baseline: a distance along the wall from corner A, then straight out.',
    'Packaging keeps evidence unchanged. Damp and biological items go in paper so they can dry, because plastic traps moisture and mold destroys DNA. Tiny trace items go in a druggist fold (folded paper); electronics go in anti-static bags. Each package is sealed, initialed and logged.'
  ]
},
bloodspatter: {
  hook: 'In a fictional case, round blood drops on a kitchen floor are each about 19 mm wide. One witness says they dripped from a hand 1 m up; another says 2 m. Can the size of the stains tell you who is right?',
  answer: 'Barely. A 50 µL drop leaves a stain about 18.9 mm wide from 1 m and 20.3 mm from 2 m, only 1.4 mm apart, and a smaller or bigger drop changes the width too. Size cannot settle it. The round shape does tell you something solid: the drops fell straight down, at close to 90°.',
  uses: [
    'Scene analysis: a stain twice as long as it is wide hit at 30°, because sin 30° = 0.5. Analysts measure many stains this way to trace them back.',
    'Carrying a dripping cup across a room: the drops on the floor stretch slightly in the direction you walked, the same clue analysts read in a drip trail.',
    'Court reports: a source height found with straight strings is given as an upper limit, because real drops curve downward and straight lines overshoot.'
  ],
  takeaway: 'Read a stain’s shape before its size. A round stain fell straight down; a long oval hit at a shallow angle, and its tail points away from where the blood came from. Size gives only a rough hint of the height.',
  tour: [
    'A 50 µL drop, about what falls from a cut fingertip, drops 1 m (about waist height) onto flat paper. Watch it fall and spread. The side view is on the left; the top view of the paper is on the right.',
    'From 3 m, about the height of a basketball rim, the drop hits faster and spreads wider. The width grows quickly at first, then levels off as the drop nears its top falling speed, terminal velocity (about 7.7 m/s, 17 mph). So you cannot read the height exactly from the size.',
    'Now the paper is tilted so the drop hits at 30°, the way a drop meets a wall at a slant. The drop keeps sliding as it spreads, so the stain stretches into an oval with a tail.',
    'The tail, and any small satellite stain past it, is on the side the drop was heading toward. So to find where the blood came from, look back the other way, opposite the tail.',
    'Stains also form patterns. A drip trail shows a source on the move, like drips from a leaky water bottle as you walk, and its tails point the way it went. Faster movement means longer stains spaced farther apart.',
    'In a scene, run a string line back along each stain’s long axis, away from its tail. Where the lines cross is the area of convergence: the blood came from somewhere above that spot on the floor.'
  ]
},
dna: {
  hook: 'Saliva on a water bottle left at a broken trophy case gives a DNA profile at 6 places (loci). One suspect matches it at 4 of the 6. Is that suspect probably the person who drank from the bottle?',
  answer: 'No. The person who left the saliva has one genotype at every locus, so the 2 clear mismatches exclude this suspect, no matter how many other loci match. Relatives often share many alleles. Only a person who matches at all 6 loci “cannot be excluded”, and even that only says the DNA could be theirs.',
  uses: [
    'Wrongful convictions: DNA testing has freed hundreds of people in the United States, usually because their profile did not match the evidence. One clear mismatch was enough.',
    'COVID PCR tests: the same doubling copies a virus’s genetic material until it is detectable. A positive after fewer cycles means more virus was in the sample.',
    'Paternity tests: the child’s allele that did not come from the mother must come from the father. A man without it at two or more loci is excluded.'
  ],
  takeaway: 'One clear mismatch rules a person out, however many other places match. A full match does not prove guilt: it says the DNA could be theirs, and someone still has to explain how it got there.',
  tour: [
    'A trophy case was broken open and a water bottle was left behind. Saliva on it holds cheek cells, and each cell holds DNA. You will compare it with an elimination sample from the coach, who belongs there, and with three suspects (all fictional).',
    'PCR works like a DNA photocopier. Each cycle heats to 95 °C to split the two strands, cools to about 60 °C so short primers stick on, then warms to 72 °C so an enzyme copies the region. Watch the copy count double every cycle.',
    'After n cycles you have 2ⁿ times as many copies. Ten cycles already make about 1,000 times more. 28 cycles turn 150 copies into about 4 × 10¹⁰ (40 billion), enough to see on a gel.',
    'The copies go into wells at the − end of a gel, a slab of firm jelly. DNA is negatively charged, so it is pulled toward the + end. Shorter pieces slip through the gel’s tiny pores faster and travel farther.',
    'The allelic ladder is a ruler made of every common allele (version) of this locus. Line up each sample band with a ladder band to read its repeat number. Two bands mean two different alleles, one from each parent; one band means both are the same.',
    'A person whose bands differ at any locus (a spot on a chromosome) cannot be the source. A person who matches at every locus “cannot be excluded”. Many people share any one locus, so labs test many; the FBI database uses 20.'
  ]
},
hairfiber: {
  hookSet: { mode: 'case', cs: 'c1', item: 'fiber', suspect: 0 },
  hook: 'A red fiber is snagged on a broken shed window. Suspect A owns a red wool sweater and Suspect B a red acrylic fleece. The color matches both. Which garment can you rule out, and can you prove the other one is the source?',
  answer: 'Under the microscope the scene fiber is a smooth acrylic rod, while wool is a scaly, crimped fiber. That one clear difference excludes Suspect A’s sweater, even though the red matches. Suspect B’s fleece agrees in type and color, so it is consistent, but that is not proof: any other fleece made of the same fiber and dye would match too.',
  uses: [
    'Wildland firefighting: crews are told to avoid synthetic underlayers, because nylon and polyester melt and stick to skin, while cotton and wool char instead.',
    'Pet hair: a dog hair’s medulla fills more than half the shaft, a human head hair’s less than a third, so an examiner can tell them apart before any DNA test.',
    'Court: in 2015 the FBI admitted its examiners had overstated hair matches in most trials it reviewed. Hair matches are now “consistent with”, confirmed by DNA.'
  ],
  takeaway: 'One clear difference rules a sample out. Agreement on every feature only means “consistent with”, because many people own the same red fleece or the same breed of dog.',
  tour: [
    'This is a human head hair at 400×; a real one is about 0.07 mm wide, thinner than a sheet of paper. Light passes through it. The darker broken core is the medulla. Around it is the cortex with its pigment grains, and the thin outer edge is the cuticle.',
    'To see the scales, paint clear nail polish on a slide, press the hair in, and peel it out. The cast shows the hair’s surface. Human scales are flat and overlap like roof shingles, a pattern called imbricate.',
    'A dog hair has a wide, unbroken medulla that fills more than half the shaft. Most animal hairs look like this, so a few minutes at a microscope can tell pet hair from human hair.',
    'Cotton, the fiber in most T-shirts, is a flat ribbon that twists back and forth: it grew as a hollow plant hair that collapsed when it dried. Synthetic fibers like nylon are smooth rods, because they are squeezed out of a nozzle.',
    'Hold a few fibers from a known sample in tweezers and bring them to a flame. Nylon melts and shrinks away, smells like celery and leaves a hard bead. Cotton would burn like paper and leave soft ash. Labs never burn the one evidence fiber.',
    'A comparison microscope shows two samples side by side. The scene hair is on the left and a suspect’s known sample is on the right. Here the scene hair is from a dog and Suspect A’s sample is from a cat, so it does not match.',
    'Suspect B’s dog hair agrees with the scene hair in every feature. Mark it Consistent, which means “could have come from”, not “did”. Then check the fiber the same way. The worksheet below the stage tracks your calls.'
  ]
},
handwriting: {
  hookSet: { mode: 'indent', elev: 90 },
  hook: 'Someone tore the top sheet off a notepad and took it, but the pen pressed grooves into the sheet below. You have a phone flashlight. Do you shine it straight down or skim it low across the page, and how much can you read?',
  answer: 'Straight down (90°), the grooves cast no shadows and you read 0% of the strokes. At 60° you read about 23%, at 30° about 88%, and with the light skimming at 6° to 10° about 97%. A low light makes every groove throw a shadow, so the hidden message appears.',
  uses: [
    'Painting and drywall: a work light held flat against a wall shows every dent and roller mark, the same low-angle trick examiners use on indented writing.',
    'Forged signatures: tracing is slow, so a traced name shows shaky lines, blunt starts and stops, and pen lifts. A real signature is fast, with tapered ends.',
    'Court: in a 2022 study of 86 document examiners, about 3% of comparisons of two different writers were wrongly called the same writer. Handwriting is treated as expert opinion.'
  ],
  takeaway: 'To find dents, grooves or scratches on any surface, light it from low and to the side, never straight on. And when you compare writing, one shared habit like a right slant means little; it takes many features agreeing.',
  tour: [
    'This note was left where the trophy used to be. A document examiner never decides from one look. Like a bank checking a signature against the one on file, they compare the note with known writing, one feature at a time.',
    'Each suspect copied the note’s words when asked. These requested exemplars (known samples) let the examiner compare the same letters side by side. Here is Suspect A: printed, upright and heavy.',
    'Lines drawn along the tall letters show the slant. The note leans right; Suspect A writes straight up and down. That is one difference.',
    'Suspect B’s writing also leans right and joins its letters, like the note. But the cursive many people learned in school does the same. Features many writers share are class characteristics, and they cannot point to one person.',
    'Now look at the a. The note uses a two-story a (the printed-book style, with a hood over the bowl) inside joined writing, which is unusual. Suspect B writes a round one-story a. A rare habit counts for more than slant.',
    'Suspect C’s exemplar agrees with the note on slant, size, spacing, joins, the a and the circle i-dots. No single feature decides it. The examiner weighs them all together, and many agreeing habits point toward one writer.',
    'The pen pressed grooves into the sheet below the note. Hold the light low and to the side, like a phone flashlight skimming the page, and the grooves cast shadows, so the message appears.'
  ]
},
anthropology: {
  hook: 'Hikers find a woman’s skeleton. Her thigh bone is 45.0 cm long and every growth plate is fused, even the collarbone’s. One missing woman is 168 cm tall and 34; another is 160 cm and 19. Which report could it be?',
  answer: 'The femur gives 2.47 × 45.0 + 54.10 ≈ 165 cm (5 ft 5 in), with a range of about 158 to 173 cm, so both heights fit. But a fully fused collarbone means older than about 23, so the 19-year-old is excluded. The 34-year-old stays a lead until dental records or DNA confirm it.',
  uses: [
    'Doctor’s office: a hand X-ray of a teenager shows which growth plates are still open, so a doctor can estimate how much more growing is left.',
    'Military remains: the Defense POW/MIA Accounting Agency uses forensic anthropologists’ profiles together with DNA and dental records to identify missing service members.',
    'Height from one bone: long leg bones carry most of your height, so a femur predicts stature to within about ±7 cm, better than an arm bone.'
  ],
  takeaway: 'A skeleton rules people out far better than it names anyone. Each clue gives a range, and fitting every range only keeps a person on the list until dental records or DNA confirm who it is.',
  tour: [
    'Hikers found a skeleton (fictional). A forensic anthropologist builds a biological profile: sex, age and height. Then that profile is compared with missing-person reports to narrow the list.',
    'The angle under the pubic bones is wide (U-shaped) in most females and narrow (V-shaped) in most males, because the female pelvis is shaped for childbirth. This one is 96°, a little more than a right angle.',
    'Growth plates, the zones near the ends of bones where you grow taller, fuse in a known order through the teens and twenties. After that, the face of the pubic bone wears from ridged to rimmed to eroded. Each method gives an age range, not one age.',
    'The femur (thigh bone) lies on an osteometric board, a ruler with end blocks, much like the foot measurer at a shoe store. Its length goes into a formula built from people of known height: 2.47 × 45.0 + 54.10 ≈ 165 cm (5 ft 5 in) for a female.',
    'The profile is a box of possible ages and heights. Reports outside the box, or of the other sex, are ruled out. MP-1 fits, so it becomes a lead, not an identification: dental records or DNA still have to confirm it.',
    'For a facial approximation, pegs cut to average tissue depths (about 4 mm on the forehead, about 20 mm on the cheek) are glued at landmarks on the skull. Clay is built up to the peg tips, and a face outline appears.'
  ]
},
timeofdeath: {
  hookSet: { view: 'insects', ta: 25, found: 'l3' },
  hook: 'In a fictional case, the oldest insects on a body found outdoors are third-stage blow fly larvae. Was the week about 25 °C or about 15 °C? How much does that change your estimate of when the eggs were laid?',
  answer: 'At 25 °C, third-stage larvae mean the eggs were laid about 58 to 98 h ago, roughly 2½ to 4 days. At 15 °C the same larvae mean about 174 to 294 h, roughly 7 to 12 days. That is three times longer, because growth counts only the degrees above 10 °C: 15 per hour versus 5.',
  uses: [
    'Forensic entomology: investigators pull hourly temperatures from the nearest weather station, because a few degrees can shift the insect clock by days.',
    'Farming: growers time pest sprays and harvests with growing degree days, the same “degrees above a base temperature” math as the insect clock.',
    'Restaurant kitchens: food codes require hot food to cool from 135 °F to 70 °F within 2 hours. Shallow pans and ice baths help, because a big temperature gap moves heat fastest.'
  ],
  takeaway: 'Every clue gives a range, not a time. Warmth speeds up the insect clock, and a big temperature gap speeds up cooling, so always find out what the temperature was before you read either clock.',
  tour: [
    'After death the body stops making heat, like an engine after you switch it off. The core (rectal) temperature starts at about 37 °C (98.6 °F), and heat flows out into the cooler air.',
    'Watch the temperature fall. Like a hot drink left on a counter, it drops fastest while it is much warmer than the air and slows down as it gets close to air temperature.',
    'The classroom shortcut is Glaister’s rule: hours since death ≈ (98.6 °F − rectal temperature) ÷ 1.5. It is the dashed straight line. Real cooling curves, so the rule is only rough, and only for the first half day or so.',
    'Rigor mortis (stiffening) starts in the small muscles after about 2 h, is complete around 12 h and passes after a day or more. Livor mortis (blood settling to the lowest parts) appears within 2 h and becomes fixed after about 8–12 h.',
    'Blow flies can lay eggs on a body within hours. The young go through egg, three larval stages, a wandering stage and a pupa, on a schedule as regular as a calendar. The oldest stage found tells how long insects have been there.',
    'Insects are cold-blooded, so they grow with heat, counted in accumulated degree hours (ADH): each hour adds (air temperature − 10 °C). At 30 °C they grow twice as fast as at 20 °C, because 20 is twice 10.',
    'Each clue gives a range of possible times, not one time. The answer has to fit all of them, so the shaded overlap is the best estimate, like finding the one hour when everyone in a group is free.'
  ]
},
fingerprints: {
  hook: 'A fictional burglar touched a glass jar and a paper envelope. Fingerprint powder is the fastest method you have. Will it give a usable print on both, and if not, what should you use on the envelope?',
  answer: 'Powder on the glass reaches about 92% contrast, sharp enough to see minutiae. On the paper it stalls near 22%, a smudge, because the sweat and oil soaked into the fibers and the powder sticks everywhere. Ninhydrin reacts with the amino acids held in the paper and reaches about 95%, a sharp purple print.',
  uses: [
    'Phone fingerprint sensors: your phone reads the same ridge endings and splits (minutiae) that examiners compare, and stores them as a math template, not a picture.',
    'Crime labs: examiners follow ACE-V (analysis, comparison, evaluation, verification), and a second examiner checks every identification. The U.S. sets no fixed number of matching points.',
    'Pattern type alone: about 60–65% of prints are loops, so a loop at the scene and a loop on a suspect’s card says very little until the minutiae line up.'
  ],
  takeaway: 'Match the method to the surface: powder or super glue for smooth things like glass, plastic and phones, ninhydrin or iodine for paper. And a matching pattern type is not a match; the ridge details have to line up.',
  tour: [
    'Your finger leaves sweat and skin oil on everything it touches, like the smudges on a phone screen. On this glass slide the print is latent: it is there, but you cannot see it. The zoom circle shows the residue on two ridges.',
    'Fine powder sticks to the moist, oily ridges and brushes off the clean valleys, the way flour clings to a damp counter. Nothing reacts. It is the fastest method, and it works best on smooth, nonporous surfaces like glass.',
    'Now the same powder on paper. Paper is porous, like a paper towel, so the residue has soaked into the fibers and the powder sticks to the fibers everywhere. The result is a smudge.',
    'Iodine crystals sublime, turning straight from solid to violet gas. The vapor dissolves into the oils on the ridges and stains them brown. It is a physical change, so once the print leaves the cabinet the iodine escapes and the print fades. Photograph it right away.',
    'Ninhydrin reacts with amino acids from sweat and makes a purple compound called Ruhemann’s purple. Amino acids stay locked in paper for years, so this works on old letters, receipts and documents.',
    'Heated super glue (cyanoacrylate) gives off vapor. Water and amino acids on the ridges start a chain reaction, and the molecules link into a white plastic that traces every ridge. It is the method for plastic bags, cans and guns.',
    'The scene print is usually only part of a fingertip. First check the pattern type (loop, whorl or arch). Then compare minutiae, the spots where ridges end or split, with each suspect’s inked print.'
  ]
},
toxicology: {
  hook: 'A kitchen has table salt, and a supplement store sells pure caffeine powder. In rats, salt’s LD₅₀ is 3000 mg/kg. Using the test group, which substance is more toxic per kilogram of body mass, and by how much?',
  answer: 'Caffeine’s LD₅₀ is 192 mg/kg, about 16 times lower than salt’s 3000 mg/kg. Half the group responds at a dose about 16 times smaller, so per kilogram caffeine is about 16 times more toxic. These are rat numbers, and harm in people starts far below them, so they rank substances but never give a safe amount.',
  uses: [
    'Caffeine powder: the FDA has warned that one teaspoon of pure caffeine powder holds about as much caffeine as 28 cups of coffee, so a small scooping error is dangerous.',
    'Poison control (1-800-222-1222): staff ask what was taken, how much and the person’s weight, because the dose per kilogram decides the risk, and a toddler weighs far less than you.',
    'Forensic toxicology: lab analysts measure a drug’s concentration in blood and compare it with published ranges to judge whether it could have caused harm.'
  ],
  takeaway: 'Toxicity is about how much per kilogram, not just what. A lower LD₅₀ means more toxic, and a small child reaches a harmful dose with much less. Animal LD₅₀ values rank substances; they never tell you a safe amount.',
  tour: [
    'Toxicologists give groups of test animals a dose of a substance and count how many respond. Each rat here is one animal in a group of 40. The dose is in milligrams per kilogram of body mass (mg/kg), so animals of different sizes compare fairly.',
    'At a low dose no animal responds. As the dose rises, the animals with the lowest tolerance respond first. Individuals differ, the way one cup of coffee keeps some people awake and not others, so the response grows gradually.',
    'Plotted against the log of the dose (each step multiplies it), the share responding makes an S. The LD₅₀ is the dose where half the group responds: 192 mg/kg for caffeine in rats.',
    'Switch to nicotine. Its curve sits far to the left: half the group responds at only 50 mg/kg, about a quarter of caffeine’s dose. The lower the LD₅₀, the more toxic the substance.',
    null,
    null
  ]
},
spottest: {
  hook: 'An unlabeled container in your kitchen holds a white powder: baking soda, cornstarch, sugar or salt. You are not allowed to taste it. Using the lab’s tests, what is the smallest set that tells all four apart?',
  answer: 'Three tests do it. Vinegar fizzes only with baking soda. Iodine turns blue-black only with cornstarch. That leaves sugar and salt, which both dissolve and both read neutral, but in the flame salt glows yellow-orange from sodium while sugar melts and chars black. pH paper could replace vinegar, since only baking soda reads basic.',
  uses: [
    'Field drug tests: police color kits are presumptive, and they have flagged harmless substances. Crime labs confirm with an instrument before a result goes to court.',
    'Baking: baking soda needs an acid such as buttermilk, yogurt or lemon juice to release the CO₂ that makes pancakes rise, the same reaction as the vinegar test.',
    'Gas stoves: when salted pasta water boils over onto a burner, the blue flame flashes yellow-orange. That is the sodium flame test.'
  ],
  takeaway: 'One test rarely names a substance. Run several tests that each react with one kind of thing, and count the negatives too. A color test only says what something might be; an instrument confirms it.',
  lede: 'Many white powders look exactly alike, from baking soda to aspirin. Run simple tests (water, iodine, vinegar, pH paper, a flame), fill in a table, and find out which powder came from the scene.',
  tour: [
    'Each well holds a pinch of a white powder, many of them from an ordinary kitchen. The last one is the evidence from the scene. A presumptive test tells you what a powder might be. Goggles on, and never taste or sniff an unknown.',
    'Water first. Salt, sugar and baking soda dissolve and look clear, like sugar stirred into tea. Cornstarch stays cloudy. Aspirin barely dissolves.',
    'Iodine is amber-brown. In the particle view, iodine ions slip inside the coiled starch molecule and the pair turns blue-black. Cornstarch, flour and potatoes all contain starch.',
    'Vinegar is acetic acid. It reacts with bicarbonate to make carbon dioxide gas, so baking soda fizzes, the same reaction as a baking-soda volcano. Powders without carbonate do nothing.',
    'The paper’s color shows the pH, how acidic or basic a solution is. Aspirin is an acid (red-orange). Baking soda is a weak base (blue-green). Most of the others are neutral (green), like pure water.',
    'A wire loop holds each powder in a burner flame. Sodium compounds glow yellow-orange, the color of old sodium streetlights. The color comes from electrons in Na⁺ falling back to a lower energy level.'
  ]
},
chromatography: {
  hookSet: { solvent: 'water', case: '1', strip: 'D' },
  hook: 'A washable marker and a permanent marker both write black. Drip water on each, and the washable one bleeds into colors while the permanent one hardly moves. Why, and what happens if you use rubbing alcohol on the permanent marker?',
  answer: 'In water, the washable marker (Pen A) splits into yellow, red and blue food dyes that climb to Rf 0.93, 0.58 and 0.82. The permanent marker’s dyes (Pen D) barely dissolve in water: two stay on the start line and one creeps to only 0.30. In isopropanol, rubbing alcohol, Pen D’s dyes climb to Rf 0.55, 0.76 and 0.88. Like dissolves like.',
  uses: [
    'Questioned documents: the U.S. Secret Service keeps a library of thousands of known inks, so examiners can compare an ink from a document with ink formulas on file.',
    'Candy coatings: put a dot of coating on a coffee filter strip with water and the food dyes, such as Red 40 and Blue 1, separate just like the pens here.',
    'Stain removal: water lifts washable marker, but permanent marker needs rubbing alcohol, because its dyes dissolve only in a less polar solvent.'
  ],
  takeaway: 'Like dissolves like: water moves water-soluble dyes, alcohol moves oily ones. When you compare inks, a mismatch rules a pen out, but a match only means the same kind of ink, so check it in a second solvent.',
  tour: [
    null,
    'Water creeps up the paper between the cellulose fibers, the same way a paper towel soaks up a spill. This is capillary action. The wet edge is the solvent front.',
    'When the front passes the ink, the dyes start to travel. Each one moves a different distance, so the black dot splits into colors, the way black marker bleeds into colored edges when it gets wet.',
    'Zoom in. Each dye molecule keeps switching between sticking to the paper and moving with the water, like a shopper who keeps stopping at stores. A dye that spends more time dissolved travels farther.',
    'Take the strips out before the front reaches the top and mark the front. Then Rf = distance the spot moved ÷ distance the solvent moved. Rf stays the same no matter how long the run is, so in one solvent it works like an ID number for each dye.',
    'Compare the note’s spots (color and Rf) with each pen. In water, only Pen C gives the same pattern as the note. That means the same kind of ink, not proof that this exact pen wrote it.'
  ]
},
spectroscopy: {
  hook: 'A clear liquid in an unlabeled bottle is either rubbing alcohol (isopropanol) or acetone nail polish remover. On an infrared spectrum, which band settles it, and where on the spectrum do you look?',
  answer: 'Look near 3350 cm⁻¹ and near 1715 cm⁻¹. Isopropanol has a broad, deep valley near 3350 cm⁻¹ from its O–H bond and nothing strong at 1715. Acetone has no O–H band, but a very strong, sharp valley at 1715 cm⁻¹ from its C=O double bond. One look at those two regions tells them apart.',
  uses: [
    'Breath alcohol: evidential breath testers measure how much infrared light the ethanol in a breath sample absorbs, using the same bond vibrations as this spectrum.',
    'Crime labs: a color spot test on a powder is only presumptive. An IR or mass spectrum matched to a reference library is the confirmatory test that holds up in court.',
    'Climate: CO₂ and water vapor absorb infrared light given off by Earth’s surface, because their bonds vibrate at those frequencies. That absorption is how they trap heat.'
  ],
  takeaway: 'Bands tell you which bonds are present; the whole pattern tells you which molecule. A broad dip near 3300 cm⁻¹ means O–H, a sharp one near 1715 cm⁻¹ means C=O. To name a substance, match the full spectrum to a reference.',
  lede: 'Shine infrared light through a sample and see where it gets absorbed. Each kind of chemical bond absorbs at its own spot, so the pattern of dips works like an ID for the molecule. Use it to identify the evidence.',
  tour: [
    'The spectrometer shines infrared light, the kind you feel as heat from a stove, through the sample and measures how much gets through at each wavenumber. Valleys are where the sample absorbs.',
    'Ethanol’s broad valley near 3340 cm⁻¹ is the O–H bond stretching. Bonds act like springs, and each one absorbs the infrared that matches how fast it vibrates. Watch it vibrate in the molecule.',
    'Acetone, the main ingredient in many nail polish removers, absorbs strongly at 1715 cm⁻¹. The C=O double bond is a stiffer spring, so it vibrates faster than C–O.',
    'Almost every organic compound, from gasoline to sugar, has C–H stretches just below 3000 cm⁻¹. Below 1500 cm⁻¹ is the fingerprint region, a pattern unique to each molecule, the way a fingerprint is unique to a person.',
    'Compare the evidence spectrum with the known compounds. Bands in the same places mean the same bonds, and a matching fingerprint region means the same molecule. This is the kind of test that confirms a color test in court.'
  ]
}
});

/* f2.js */
BioLab.addPractical({
hashing: {
  hook: 'Your coach emails the team a permission form, and someone changes one character in the file: $40 becomes $90. The file’s SHA-256 hash is 64 characters long. Will the new hash differ by one character, or by almost all of them?',
  hookSet: { mode: 'sandbox' },
  answer: 'Almost all of them. Changing one character flips about half of the 256 bits, around 128, so roughly 60 of the 64 characters come out different. A hash never looks “close”. Any edit, however small, gives a completely different fingerprint, which is how investigators spot the one altered copy among five.',
  uses: [
    'Downloads: many software sites post a SHA-256 hash next to the file. If your copy’s hash matches in all 64 characters, the download is complete and unchanged.',
    'Court evidence: examiners hash a phone’s data when they copy it and at every handoff, so a matching hash at trial shows nothing changed.',
    'Passwords: well-run sites store a hash of your password, not the password itself, so they can check what you type without keeping it.'
  ],
  takeaway: 'A matching hash means two files are identical, byte for byte. Any change, even one character, gives a completely different hash. A hash proves a file is unchanged; it cannot tell you whether the file is true or who made it.',
  tour: [
    'An examiner copied the files off a seized phone and ran SHA-256 on each one. The 64-character result is the file’s hash, a fingerprint made from every byte. Same bytes, same hash, every time.',
    'Copies went to the prosecutor, the defense expert, the lab archive, the detective and the court. Like five photocopies of one test, each should match the original exactly, so each should give the same hash.',
    'Hashing copy A gives the same 64 characters as the original. You do not have to compare the files byte by byte: a matching hash means every byte is identical.',
    'Here Text B differs from Text A by one character. About half of the 256 bits flip, shown in red. This avalanche effect, one tiny change scrambling the whole hash, is why even a one-character edit cannot hide.',
    'This is the altered copy. Each person who received it logged a hash, like signing for a package. The first logged hash that does not match shows when the file changed.'
  ]
},
filesig: {
  hook: 'You find homework.txt on an old USB stick, but opening it in a text editor shows gibberish. A hex viewer shows its first bytes are FF D8 FF E0. Is the file broken, or is it something else wearing the wrong name?',
  hookSet: { mode: 'case', file: 1 },
  answer: 'It is not broken. FF D8 FF is the signature every JPEG photo starts with, so homework.txt is an image with a .txt name. Opened as an image, it shows a drawing of the leaked drone design. Renaming changes only the label; the bytes still say what the file really is. Three of the ten files on this drive were renamed that way.',
  uses: [
    'iPhone photos: many are saved as HEIC. Renaming one to .jpg does not convert it; the bytes stay HEIC, so a site that wants JPEG can still reject it. Export it instead.',
    'Word files: a .docx is really a ZIP archive. Copy one, rename the copy to .zip, and you can open it and pull out the original photos inside.',
    'Investigators: forensic tools compare every file’s first bytes with its extension and flag mismatches, a quick way to catch photos or documents hidden under harmless names.'
  ],
  takeaway: 'A file’s name and extension are labels anyone can change. The first few bytes, the signature, tell you what the file really is. Renaming never converts a file; use an app’s Export or Save As.',
  tour: [
    'Police seized a USB drive. Its owner says it holds only homework and music. Anyone can rename a file in two seconds, so investigators never trust names or extensions.',
    'A hex viewer shows every byte. Left: the offset, how far into the file you are. Middle: each byte as two hex digits, 00 to FF. Right: the same byte as a character, or a dot if it is not printable.',
    'Most file types start with a fixed pattern of bytes called a file signature or magic number, like a return address printed on every envelope. A JPEG starts FF D8 FF. A PDF starts with the characters %PDF.',
    'This file claims to be text, but it starts FF D8 FF E0: a JPEG photo. That is why a text editor shows gibberish. Open it as an image in the panel below the stage to see what it really holds.',
    null
  ]
},
metadata: {
  hook: 'Your phone writes the time and GPS location into every photo it takes. A suspect’s alibi photo says 9:15 PM at Lakeside Diner, but the file says a photo editor saved it two days later. Does the photo prove where he was?',
  hookSet: { mode: 'exif', item: 'photo2' },
  answer: 'No. A photo editor can retype the date and GPS fields, so the photo is unreliable either way. Records the suspect could not edit tell the story: the school Wi-Fi, his door badge and a hall camera put him at the school, 3.2 km from the diner, from 8:44 to 9:08 PM, inside the 8:30 to 9:30 PM theft window.',
  uses: [
    'Sharing photos: on an iPhone, tap Options in the share sheet and turn off Location before you send. Otherwise an AirDropped or emailed original can show exactly where you took it.',
    'Sign-in alerts: many servers log in UTC. A login at 03:47 UTC on a winter night was 8:47 PM the evening before in Denver, which runs on UTC−7 in winter.',
    'Investigators: they trust records a system writes on its own, like Wi-Fi joins and door badges, over files a person can edit, and look for several sources that agree.'
  ],
  takeaway: 'Every photo you take can carry the time and your exact location, so check what you share. Metadata can also be edited, so treat a timestamp as a clue, not proof, until separate records agree.',
  tour: [
    'Hale claims he was at Lakeside Diner from 8 to 10 PM (blue band). The controller went missing between 8:30 and 9:30 PM (red band). If the evidence puts Hale somewhere else inside the red band, the alibi fails.',
    'Each lane is a different source: a diner receipt, Hale’s phone, the school Wi-Fi, door badges and a hall camera. One record can be wrong or faked. Separate systems that agree are much harder to fake.',
    'Card 1 is the diner receipt, printed at 8:12 PM. It goes in the Diner lane at 8:12, so Hale really was at the diner early in the evening.',
    'The badge log shows Hale’s badge opening the robotics lab door at 8:47 PM, at the same time he says he was eating at the diner.',
    'Hale’s alibi photo says 9:15 PM at the diner, but its Software tag names a photo editor and it was modified two days later. An editor can retype any date or location, so mark it unreliable.',
    'The finished timeline: phone, badge and camera put Hale at the school from 8:44 to 9:08 PM, inside the theft window. Three systems agree, and only the edited photo disagrees. The alibi fails.'
  ]
},
recovery: {
  hook: 'You are giving your old USB stick, full of photos, to a younger cousin. You could delete the photos, quick-format the stick, or do a full format that writes zeros. Which of these actually stops your cousin from getting the photos back?',
  hookSet: { mode: 'erase' },
  answer: 'Only the full format. After a delete, 100% of the data is still on the stick and file-table recovery brings it all back. After a quick format, 100% is still there and carving for signatures recovers 73% of it, photos included, minus their names. Writing zeros over every cluster leaves 0%, and one pass is enough on a modern drive.',
  uses: [
    'Photos app: a deleted iPhone photo sits in Recently Deleted for 30 days, and iCloud or Google Photos may hold another copy. Deleting in one place rarely deletes it everywhere.',
    'Selling a phone: use Erase All Content and Settings (iPhone) or a factory reset (Android). Modern phones are encrypted, so the reset throws away the key and the old data becomes unreadable.',
    'Windows: formatting a drive with the Quick Format box unchecked writes zeros over the whole drive. With the box checked, it only writes a new, empty file table.'
  ],
  takeaway: 'Deleting hides a file; it does not erase it. The bytes stay until something writes over them. Before you give a drive away, do a full format or use the device’s erase or reset, and remember the copies in your cloud.',
  tour: [
    'Each square is one cluster, a 4 KB block of storage with room for about 4,000 letters of plain text. A file takes as many clusters as it needs. The letters and colors show which file each cluster belongs to.',
    'The file table lists every file’s name, size and clusters, like a book’s table of contents. The computer reads it to show you your files. It is listed beside the drive and in the panel below the stage.',
    'Delete vacation.jpg. Its entry is marked deleted and its clusters are marked free (striped), but the photo’s bytes are still sitting there. Deleting tears the page out of the table of contents, not out of the book.',
    'Every new file goes into free clusters. After several days of saving and deleting temporary files, some of the deleted photo’s clusters have been reused. Those parts are gone for good.',
    null,
    'Carving ignores the table. It scans free space for the first bytes every file of a type starts with, like FF D8 FF for a JPEG photo, and reads forward from there. That is how photos survive a quick format.'
  ]
},
passwords: {
  hook: 'Your school makes you pick a new password. You are choosing between “Sunshine2024!”, which has all four kinds of character, and five random words like “maple orbit candle river lantern”. If a site’s password hashes get stolen, which one holds out longer?',
  answer: 'The five words, by far. “Sunshine2024!” is a common word plus a year and a symbol, a pattern attackers try first, so it falls instantly against a fast hash. The passphrase needs about 2⁵⁵ guesses: about 57 days on one gaming GPU against a fast hash, and about 157,000 years against a slow hash like bcrypt.',
  uses: [
    'Password managers: the Passwords app on iPhone and the managers built into Chrome and Edge make and remember a long random password for every site, so you memorize only one.',
    'Breaches: haveibeenpwned.com shows whether your email appeared in a known breach. If it did, change that password everywhere you reused it.',
    'Multi-factor: with MFA turned on, a stolen password alone cannot sign in to your account. The attacker also needs your phone or security key.'
  ],
  takeaway: 'Length from randomness beats clever symbols. Use a long passphrase or a password manager’s random password, use a different one for every site, and turn on MFA so a leaked password alone cannot get in.',
  tour: [
    'Each box is one character, colored by its kind: lowercase, uppercase, digit or symbol. The pool is how many characters an attacker must try in each position: 26 with lowercase only, 95 with all four kinds.',
    'Twelve random lowercase letters beat eight: each extra letter multiplies the guesses by 26. Eight letters fall in about 21 seconds to a fast offline attack; twelve take about 110 days. Watch the bars on the time chart jump right.',
    'This one has all four kinds of character, but it is a common word with a capital, a year and a symbol. Attackers try exactly these patterns first, so it falls far faster than the pool suggests.',
    'Online, the site locks your account after a few wrong tries, so guessing is slow. Offline, the attacker has stolen the stored hashes and guesses on their own computer, as fast as the hash allows, with no lockout.',
    null,
    'A fictional pet store saved each password as a SHA-256 hash. The same password always gives the same hash, so matching colors in the stored column show customers who share a password. One good guess unlocks all of them.',
    'Mixing a random salt into each password before hashing makes every stored value different, even for the same password. The attacker can no longer spot shared passwords or test one guess against every account at once.'
  ]
},
phishing: {
  hook: 'An email from “Pinecrest Credit Union” says your account will be suspended in 24 hours unless you confirm your password. The link reads pinecrest.example.com, but pressing and holding it shows pinecrest.example.com.account-verify.test/login. Who owns that site, and what should you do?',
  hookSet: { mode: 'inbox', msg: 2 },
  answer: 'Whoever owns account-verify.test. Read the address from the right, up to the first slash; everything to its left is a label that owner made up. The email has five clues: a sender at pinecrest-alerts.test, replies going to a free account, a generic greeting, a deadline with a password request, and the link. Report it, then open the credit union’s app yourself.',
  uses: [
    'Package texts: a “delivery failed” text with a link is a common scam. Check by typing the carrier’s address yourself or opening the store’s app, never by tapping the link.',
    'School email: in Outlook, choose Report, then Report phishing, instead of only deleting the message, so IT learns about it and can warn others.',
    'Gift cards: anyone who asks you to pay with gift card codes, even under a name you know, is running a scam. Check in person or by a number you already have.'
  ],
  takeaway: 'Before you click, check who a message is really from and where the link really goes, reading the domain from the right. A rush plus a request for a password, code or payment means phishing. Go to the site yourself.',
  tour: [
    null,
    '“Pinecrest Credit Union (fictional)” is only a display name, and a sender can type anything there. The real address is security@pinecrest-alerts.test, which is not the credit union’s domain, pinecrest.example.com.',
    'The link text says pinecrest.example.com, but the real target goes to account-verify.test. Link text is just words anyone can type. On a computer, hover over a link; on a phone, press and hold it.',
    'A short deadline, a threat to close your account, and a request for your password. Scammers rush you so you do not stop to check. Banks say they will never ask for your password by email.',
    '“Delivery_Label.pdf.exe” ends in .exe, so it is a program, not a PDF. Only the last extension counts, and Windows hides known extensions by default, so this file can show up as Delivery_Label.pdf.',
    'This sign-in alert comes from the real domain, uses your name, and has no link. It tells you to use the app or call the number on your card. That is what a legitimate alert looks like.',
    null
  ]
},
stego: {
  hook: 'A suspect posts an ordinary harbor photo online. Investigators also have the original from the suspect’s camera card, and the two look identical. If a message is hidden in the posted one, how much did it change the pixels, and how would you find it?',
  answer: '320 of the 6,144 pixels changed, each by just 1 out of 255, all in the top rows. You find it by comparing the files, not by looking: red bit plane 0 shows stripes instead of static. Reading those bits gives scrambled text, and undoing a Caesar shift of 7 turns it into “MEET AT PIER 9 ON FRIDAY AT 6 PM”.',
  uses: [
    'Printers: many color laser printers add faint yellow dots to every page that encode the printer’s serial number and the print date. Investigators have used them to trace leaked documents.',
    'Posting photos: apps like Instagram recompress uploads as JPEG, which scrambles the lowest bits. Data hidden this way survives only in lossless files such as PNG.',
    'Messaging apps: WhatsApp encrypts with AES keys, which have at least 2¹²⁸ possible values. A Caesar cipher has 25, so a computer tries every one before you blink.'
  ],
  takeaway: 'Looking the same is not being the same: a file can carry bits your eye will never see, so investigators compare bytes, not looks. And a cipher with only a few keys, like Caesar’s 25, hides nothing from a computer.',
  tour: [
    'A suspect posted this harbor photo. Investigators also have the original from the suspect’s camera card. Side by side, the two look the same. Your eyes say nothing changed; the bytes may disagree.',
    'Every pixel stores three numbers from 0 to 255: how much red, green and blue, like three dimmer switches. Each number is 8 bits. The lowest bit changes the value by only 1, a step no eye can see.',
    'The Difference view marks every pixel that is not identical. Only the top rows changed, 320 pixels, each by 1 out of 255: far too small to see, but not random.',
    'This view shows only bit 0 of every red value: white for 1, black for 0. Camera noise looks like TV static. The hidden text makes neat stripes across the top.',
    null,
    'The suspect also shifted every letter by the same amount, here 7, so A becomes H. The wheel shows the shift: outer ring plain, inner ring cipher. With only 25 shifts, trying them all takes a minute by hand.'
  ]
},
casefile: {
  hook: 'The answer key to your chemistry lab practical leaks into a group chat. Sam was badged into the lab until 3:35 PM, and Riley says they left at 3:30. The teacher’s account signs in on lab computer LAB-07 at 3:41 PM. Who had the opportunity, and is that enough to accuse anyone?',
  hookSet: { station: 'time' },
  answer: 'Riley. Riley’s badge opened the lab at 3:38 PM, three minutes before the login, and the key was copied to the USB at 3:44. Sam left six minutes before the login. Opportunity alone is not enough: the case holds only when reliable cards show the drive is unchanged, the key was on it, and Riley is tied to the stolen login and the note signed -RM.',
  uses: [
    'Screenshots: a screenshot of a chat is easy to edit. Schools and police ask for the original messages or the platform’s records, then look for a second source that agrees.',
    'Rumors: being in the room, or forwarding a post, puts someone near an event, not at it. Jordan forwarded the key after it was posted, which proves nothing about the theft.',
    'Your accounts: Microsoft and Google both list recent sign-ins with time, device and location. A sign-in you do not recognize means change the password and turn on MFA.'
  ],
  takeaway: 'Verify evidence before you trust it, and make every claim rest on a reliable record. Being nearby is not proof. Several independent sources that agree beat one clue that only looks strong.',
  tour: [
    'The answer key to a chemistry lab practical leaked into a student group chat. Every station adds evidence cards to this board, like a detective’s wall. At the end you name a suspect and back each claim with a card.',
    'Investigators hash the drive when they seize it, a fingerprint of every byte. A working copy is trustworthy only if its hash matches the one in the custody log exactly. Otherwise the defense can say the evidence changed.',
    'chem_notes.txt starts with 50 4B 03 04, the signature of a ZIP file. Word .docx files are ZIP files inside, so this “text file” is really a renamed Word document.',
    'Deleting ~draft.txt only freed clusters 21 to 23 in the file table. Two still hold the text; cluster 23 was reused by a song, so the end of the note is gone.',
    'Badges, sign-in logs and file times go on one timeline. Riley said they left at 3:30, but Riley’s badge opened the lab at 3:38, three minutes before the 3:41 login.',
    'A fake help-desk email is how the teacher’s password was stolen. The real domain is the last part, account-verify.test, and the link goes somewhere other than it shows. Replies go to rm.lab42, a clue to the sender.',
    'Blue bit plane 0 of cat.png has a striped band: text, not camera noise. Extracting the bits gives a note signed -RM. Initials point to a suspect, but on their own they are a clue, not proof.',
    'Accuse one suspect and attach one card to each claim. A claim counts only if a reliable card really supports it. Red herrings put people near the case, not at the crime, the same mistake rumors make.'
  ]
},
binary: {
  hook: 'A phone game stores your score in one byte: eight on/off switches. You are at 250 points and earn 10 more. What does the scoreboard show, and why?',
  hookSet: { mode: 'overflow' },
  answer: '4. Eight bits can count only from 0 to 255. 250 + 10 = 260 needs a ninth bit, so that carry falls off the end and the byte keeps 260 − 256 = 4. Bigger counters push the limit back (32 bits reach about 4.3 billion), but every fixed-size number has a top.',
  uses: [
    'Pac-Man: the 1980 arcade game stores its level in one byte. At level 256 the counter overflows and half the screen fills with garbage, so the game cannot be finished.',
    'Texting: a plain SMS holds 160 characters. One emoji switches the whole text to a 16-bit code, and the limit drops to 70 characters per message.',
    'Phone photos: a 12-megapixel photo is 12 million pixels × 3 bytes, about 36 MB of raw numbers. JPEG or HEIC compression shrinks that to a few MB.'
  ],
  takeaway: 'Texts, photos and game scores are all stored as bytes, numbers from 0 to 255. A fixed-size number wraps around past its top, and one flipped bit changes the meaning, which is why devices add check bits to catch errors.',
  tour: [
    'Each box is a bit: a switch that is off (0) or on (1), like a light switch. Eight bits make a byte, enough for one plain letter of a text. Click any switch to flip it.',
    'Each switch is worth twice the one to its right: 1, 2, 4, 8 … 128, like coins that keep doubling. Add the ones that are on. Here 128 + 32 + 4 + 1 = 165.',
    'Every character you type has a number code. “C” is 67 and fits in one byte. “é” needs two bytes in UTF-8, the code your phone and browser use, and an emoji needs four.',
    'Each pixel on your screen is three bytes: red, green and blue light from 0 to 255. Change a pixel’s numbers and its color changes. A photo is millions of these.',
    'Comet Dash (fictional) keeps its score in one byte, and 255 is the most 8 bits can hold. Here 250 + 10 should be 260, but the carry bit falls off the end and the score rolls over to 4, like an odometer passing 999,999.',
    'A message arrived with one bit flipped, so one letter changed. The sender added a parity bit to make every character’s count of 1s even. The character with an odd count is the broken one.'
  ]
},
internet: {
  hook: 'You submit an essay from home at 11:58 PM. It leaves your laptop as 8 numbered packets, and while it is sending, a wire between two routers on the way gets cut. Does the essay still arrive whole, and in order?',
  hookSet: { mode: 'send', fault: 'L:R5-R7' },
  answer: 'Whole, yes; in order, no. Routers drop the cut R5–R7 wire from their routes and steer around it, and all 8 packets arrive in about a quarter of a second. A few, usually 2 to 4, show up out of order. The server uses their numbers to put the essay back together and acknowledges each one.',
  uses: [
    '“Server not found”: the DNS lookup failed, so the name never became an address. If other sites load fine, your Wi-Fi works and the problem is that name or its server.',
    'Video calls: live calls usually skip lost packets instead of waiting for resends, so a weak connection gives frozen frames or choppy audio rather than a long pause.',
    'Investigators: every packet carries an IP address. With a court order, an internet provider can say which customer had that address at a given time.'
  ],
  takeaway: 'Your data travels as numbered packets that each find their own way, so one broken link rarely stops anything. When a site will not load, test one step at a time: the name lookup, your own connection, then the site.',
  tour: [
    'Maya’s laptop is on the left and the lunarlibrary.test server (fictional) is on the right. Between them, routers pass data along wires, like post offices handing a letter along. There are many possible paths.',
    'People type names; computers need numbers. A DNS lookup is the internet’s contact list: it asks a chain of servers until one knows that www.lunarlibrary.test is 203.0.113.80.',
    'Before sending the essay, the laptop says hello to the server and waits for a reply, so both sides know the other is ready, the way you check someone can hear you before you start talking on a call.',
    'The essay is split into numbered packets. Each router sends a packet one step closer, picking any of the equally short paths, so packets from one essay spread out across the map.',
    'Packets arrive out of order. The server uses their numbers to put the essay back together, like numbered pages, and acknowledges each one so the laptop knows it arrived.',
    'Cut the R5–R7 wire and send again. Routers learn the wire is gone and steer around it, like traffic taking a detour. Many paths make the internet hard to break.'
  ]
},
pubkey: {
  hook: 'You check your grades on the school’s guest Wi-Fi. The site uses HTTPS, so your browser shows a padlock. Someone else on the network copies every packet you send. What can they learn, and what stays hidden?',
  hookSet: { mode: 'case', setup: 2 },
  answer: 'They cannot read your grades. Your browser and the site agree on a key in public, and copying that exchange does not reveal it: in the model, Eve tries 30,000 guesses and would need about 1.2 × 10¹⁸. She can still see that your device talked to that server, when, and how much data moved. Encryption hides what you said, not that you said something.',
  uses: [
    'Certificate warnings: “Your connection is not private” means the site’s certificate failed a check: expired, wrong name or unknown issuer. On a sign-in page, do not click past it.',
    'Look-alike sites: a phishing site can get a real certificate for its own name, so it shows a padlock too. The padlock checks the name; you check it is the right name.',
    'Phone updates: iOS and Android updates are digitally signed. Your phone checks the signature and refuses an update that was changed after signing.'
  ],
  takeaway: 'The padlock means your data is encrypted and you reached the name in the address bar. It does not mean the site is honest or hide that you visited. Read the name, and never click past a certificate warning when signing in.',
  tour: [
    'Ava wants to send Ben a message, but every message crosses a line Eve can copy, like shared Wi-Fi at a coffee shop. With no encryption, Eve reads it all.',
    'If Ava locks the message but sends the key first, Eve copies the key too, like mailing a locked box with the key taped to the lid. The real problem is agreeing on a key while someone listens.',
    'Ava and Ben each mix a secret color into the common paint and swap the mixes. Each adds their own secret again, and both get the same final color. Eve sees both mixes but cannot un-mix paint to find the secrets.',
    'Ava signs her message with her private key, which only she has. Eve changes $5 to $9, and Ben’s check fails because the message no longer matches the signature.',
    'A site proves its key with a certificate signed by an authority your browser trusts. The padlock means encrypted and the right name, not that the site is honest. A scam site can have a padlock too.'
  ]
},
risk: {
  hook: 'You help a small bakery decide where to spend its security money first. Power outages happen about 1.5 times a year and cost $1,500 each. Ransomware hits about once every 4 years but costs $40,000. Which costs the bakery more per year?',
  hookSet: { mode: 'case', view: 'matrix', threat: 'ransom' },
  answer: 'Ransomware. Expected yearly loss is how often times how much: power is 1.5 × $1,500 = $2,250 a year, and ransomware is 0.25 × $40,000 = $10,000 a year, about four times as much. Backups would not stop ransomware getting in, but they cut each hit from $40,000 to about $6,000.',
  uses: [
    'Your phone: an iCloud or Google backup does not stop you losing the phone, but it cuts the damage. Your photos and messages come back on the next one.',
    'Updates: ransomware often gets in through old flaws that already have a fix. Automatic updates on your phone and laptop close those holes for free.',
    'Phone insurance: AppleCare or a carrier plan moves a rare, expensive loss onto someone else for a fixed price. Analysts call that transferring the risk.'
  ],
  takeaway: 'Rank risks by how often times how much, not by how scary or how common they feel. Stack several imperfect defenses, since each one shrinks what gets through, and keep a backup so the attack that does get through costs less.',
  tour: [
    null,
    'Each threat lands on the grid by how likely it is in a year (up) and how bad one incident is (right). The top-right corner, both likely and costly, is where the worst risks live.',
    'Power outages happen 1 to 2 times a year but cost about $1,500 each: about $2,250 a year. Ransomware hits about once every 4 years but costs about $40,000: $10,000 a year. Over time, ransomware costs the bakery about four times as much.',
    'One defense always has holes, like a slice of Swiss cheese. Stack several and an attack only gets through if it finds a hole in every one. Here an email filter, training and MFA guard against phishing.',
    'Backups do not stop ransomware from getting in. They let the bakery restore its files, so the damage drops from $40,000 to about $6,000. A control that cuts the damage after an attack is a corrective control.',
    null
  ]
},
logs: {
  hook: 'Your school’s sign-in page raises an alert when one address fails 10 sign-ins in 10 minutes. A teacher wants the limit lowered to 3, to be safe. Over 30 days, does that catch more attacks, and what else changes?',
  hookSet: { mode: 'alerts' },
  answer: 'It catches no more: both settings catch 8 of the 14 attacks in 30 days. But false alarms jump from 14 to 75, because plenty of real people mistype a password three times. Raise the limit to 40 instead and only 2 of the 14 attacks trip it. A good threshold sits between the typos and the attackers.',
  uses: [
    'Your accounts: Microsoft and Google send “unusual sign-in” alerts from rules like these. Check the time, place and device before you dismiss one.',
    'Car alarms: they go off for so many harmless bumps that people stop looking. Security teams tune rules so the alerts that do fire are worth checking.',
    'Investigators: logs are evidence. Matching addresses and times across sign-in, firewall and web logs turns scattered lines into one story of an attack.'
  ],
  takeaway: 'Every sign-in and connection leaves a line in a log, and alerts are counting rules. Set the line too low and real warnings drown in false alarms; set it too high and slow attacks slip under. When your account warns you, check it.',
  tour: [
    'Each lane is one log: sign-ins, the firewall and the school’s web server. Every bar counts the lines in 15 minutes. Red parts are failures, denied connections or web errors, the lines worth a second look.',
    'Most of the day looks like routine school traffic. A tall red spike in the morning sign-in lane stands out: dozens of failed sign-ins in a few minutes. Spikes like this are where analysts look first.',
    'The search box keeps only the lines that match, like searching your email. Here the filter keeps failures from 7 to 8 a.m. Matching lines turn blue on the timeline and fill the table under the stage.',
    null,
    'Drop the threshold to 3 and the rule also fires on people who simply mistype their password: 75 false alarms in 30 days instead of 14. Too many false alarms and analysts stop paying attention, like a car alarm nobody checks.'
  ]
},
firewall: {
  hook: 'The library’s firewall has one rule, “allow any to any”, and a laptop on guest Wi-Fi got into the staff file server on port 445. A volunteer adds rule 2 under it: “deny Guest Wi-Fi to Servers, port 445.” Does that stop the break-in?',
  answer: 'No. The firewall reads rules from the top and stops at the first match, and “allow any to any” matches everything, so rule 2 is never reached. Unwanted traffic blocked stays at 0%. Put narrow denies above the allows and let the implicit deny catch the rest: the library’s better 8-rule set keeps 100% of needed traffic working and blocks 100% of the unwanted.',
  uses: [
    'Laptop on public Wi-Fi: when Windows asks whether to allow an app on public networks, say no unless you need it. The public profile blocks more incoming connections.',
    'Home router: it drops connections from the internet that nobody inside asked for, like the implicit deny. That is why your home devices are not reachable from outside by default.',
    'Guest networks: putting visitors and smart gadgets on your router’s guest Wi-Fi keeps them away from your laptops, the same zone idea the library uses.'
  ],
  takeaway: 'A firewall reads its rules top to bottom, the first match wins, and anything not allowed is dropped. Put narrow blocks above broad allows, and allow only what people actually need.',
  tour: [
    'The library network has four zones: guest Wi-Fi for patrons, staff computers, servers, and the internet. Every packet that crosses between zones passes through the firewall in the middle, like a guard at the only door.',
    'Each dot is a packet. Its color and port number tell you the service, like an apartment number on an address: 443 is secure web, 53 is DNS (looking up names), 445 is file sharing, 587 is sending email, 3389 is remote desktop.',
    null,
    'Here is a better rule set. The firewall reads rules from the top and stops at the first one that matches, like a bouncer working down a list. A deny for guests sits above the allows, so guest packets to the servers drop (red ✕).',
    'Anything no rule allows falls through to the bottom, where an invisible “deny everything” rule waits. The port scan and the outside remote desktop attempts die there, without any rule naming them. Unlisted means blocked.'
  ]
}
});
