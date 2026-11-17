/* Myth or fact (idea from Dr. Sandy Robertson's ENSO Explorer, Nov 17, 2026). See ENGINE.md.
   BioLab.addMyths({toolId:[{k,s,fact,why,lvl}]}): one graded try, then why. Mix in real facts. */
BioLab.addMyths({
fingerprints:[
 {k:'twins',s:'Identical twins have identical fingerprints.',fact:false,why:'Twins share DNA, but ridge details form from tiny differences in the womb, so their prints differ.'},
 {k:'types',s:'Most fingerprints can be sorted into loops, whorls and arches.',fact:true,why:'Loops are the most common, then whorls; arches are the rarest. Examiners then compare fine details called minutiae.'},
 {k:'instant',s:'A computer search instantly proves who left a print.',fact:false,why:'Databases like the FBI’s return a list of candidates. A trained examiner compares them, and another examiner checks the work.'}
]
});

/* Batch 2 (Nov 17, 2026): the rest of ForensicsLab. */
BioLab.addMyths({
crimescene:[
 {k:'tv',s:'Real crime labs return DNA results in minutes, like on TV.',fact:false,why:'Lab results often take days to months, and backlogs are common. TV shortens it for the story.'},
 {k:'photo',s:'Investigators photograph evidence before they move it.',fact:true,why:'Photos and sketches record exactly where everything was. Once moved, that is lost.'},
 {k:'paper',s:'Wet biological evidence should be packed in sealed plastic bags.',fact:false,why:'Plastic traps moisture, and mold can destroy DNA. Air-dry it and use paper.'}
],
chromatography:[
 {k:'ink',s:'Two black pens can contain different mixtures of dyes.',fact:true,why:'Chromatography separates them into different patterns of colors.'},
 {k:'rf',s:'An Rf value is how far a dye moved divided by how far the solvent moved.',fact:true,why:'It is between 0 and 1, and it lets you compare dyes run on different papers.'},
 {k:'below',s:'You should start the ink spot below the solvent line.',fact:false,why:'The ink would dissolve into the solvent pool. Start above the solvent so it climbs the paper.'}
],
spottest:[
 {k:'confirm',s:'A color-change spot test proves exactly what a powder is.',fact:false,why:'Spot tests are presumptive: several substances can give the same color. A lab confirms with a second method.'},
 {k:'fast',s:'Spot tests are used because they are quick and cheap.',fact:true,why:'They narrow down the possibilities in the field.'},
 {k:'control',s:'Running a known sample alongside the unknown helps you read the result.',fact:true,why:'A positive and negative control show what each result looks like.'}
],
spectroscopy:[
 {k:'finger',s:'An infrared spectrum can act like a fingerprint for a compound.',fact:true,why:'Each compound absorbs a unique pattern of infrared light.'},
 {k:'destroy',s:'Spectroscopy always destroys the sample.',fact:false,why:'Many methods, like IR and Raman, leave the sample intact for other tests.'},
 {k:'confirm',s:'Labs use spectroscopy to confirm a result from a presumptive test.',fact:true,why:'A different method that agrees makes the identification much stronger.'}
],
toxicology:[
 {k:'dose',s:'Whether something is a poison depends on the dose.',fact:true,why:'“The dose makes the poison,” from Paracelsus in the 1500s.'},
 {k:'gone',s:'Once a drug leaves the blood, toxicologists can’t detect it anymore.',fact:false,why:'Traces can stay in urine, hair or other tissue long after.'},
 {k:'hair',s:'Hair can show drug use over months.',fact:true,why:'Drugs are built into the hair as it grows, about 1 cm a month.'}
],
dna:[
 {k:'twins',s:'Standard DNA profiles can’t tell identical twins apart.',fact:true,why:'Identical twins share almost the same DNA, so STR profiles match. Fingerprints can tell them apart.'},
 {k:'all',s:'A DNA profile reads a person’s whole genome.',fact:false,why:'It compares about 20 short tandem repeat (STR) locations that vary a lot between people.'},
 {k:'random',s:'The chance that two unrelated people share a full STR profile is extremely small.',fact:true,why:'Often less than one in billions, because each location varies independently.'}
],
hairfiber:[
 {k:'root',s:'A hair with its root attached can give a DNA profile.',fact:true,why:'The root has cells with nuclear DNA. A cut hair shaft has much less.'},
 {k:'unique',s:'Looking at a hair under a microscope can prove it came from one person.',fact:false,why:'It can only show it is similar. The FBI found errors in many old hair-match testimonies; DNA is needed.'},
 {k:'fiber',s:'Fibers transfer between people and places they touch.',fact:true,why:'That is Locard’s exchange principle: every contact leaves a trace.'}
],
anthropology:[
 {k:'pelvis',s:'The pelvis is one of the best bones for telling whether a skeleton was male or female.',fact:true,why:'The female pelvis is usually wider, with a broader opening for childbirth.'},
 {k:'growth',s:'Growth plates can help estimate a young person’s age.',fact:true,why:'They fuse at fairly predictable ages through the teens and twenties.'},
 {k:'face',s:'Facial reconstruction shows exactly what a person looked like.',fact:false,why:'It is an estimate from tissue-depth averages. Ears, lips and hair are guesses.'}
],
bitemarks:[
 {k:'reliable',s:'Bite mark matching is as reliable as DNA.',fact:false,why:'Reviews, including a 2016 White House science report, found it lacks scientific support. Several convictions based on it were overturned.'},
 {k:'teeth',s:'Dental records are a reliable way to identify human remains.',fact:true,why:'Comparing teeth and fillings with X-rays from a dentist is well tested.'},
 {k:'skin',s:'Skin stretches and swells, which distorts a bite mark.',fact:true,why:'That is one reason bite mark comparisons are unreliable.'}
],
lipprints:[
 {k:'unique',s:'Lip prints have patterns of grooves that differ between people.',fact:true,why:'Researchers classify them, but their use in court is limited and debated.'},
 {k:'dna',s:'A lip print on a glass can also hold DNA.',fact:true,why:'Saliva and skin cells can be swabbed for a DNA profile.'},
 {k:'court',s:'Lip prints are as widely accepted in court as fingerprints.',fact:false,why:'They are much less studied and rarely used.'}
],
handwriting:[
 {k:'same',s:'Nobody writes their signature exactly the same way twice.',fact:true,why:'Natural variation is expected. A perfectly identical copy can be a sign of tracing.'},
 {k:'personality',s:'Handwriting reveals your personality.',fact:false,why:'That is graphology, which studies don’t support. Document examiners compare letter forms, not personality.'},
 {k:'slow',s:'Forgeries often show slow, shaky strokes.',fact:true,why:'Copying carefully loses the fluid speed of natural writing.'}
],
bloodspatter:[
 {k:'angle',s:'The shape of a blood drop shows the angle it hit at.',fact:true,why:'Rounder drops hit straight on; longer ones hit at a low angle. sin θ = width ÷ length.'},
 {k:'tail',s:'The tail of an elongated stain points back to where the blood came from.',fact:false,why:'The tail points in the direction the drop was traveling, away from the source.'},
 {k:'origin',s:'Tracing several stains back can locate where the blood came from.',fact:true,why:'Their paths meet at the area of convergence; the angles add the height.'}
],
timeofdeath:[
 {k:'exact',s:'Body temperature gives an exact time of death.',fact:false,why:'Cooling depends on clothing, room temperature and body size, so it gives a range.'},
 {k:'rigor',s:'Rigor mortis sets in and then goes away within a few days.',fact:true,why:'Muscles stiffen in a few hours, peak around 12 hours, and relax after about 36 to 48 hours.'},
 {k:'insects',s:'Blowfly larvae can estimate time since death.',fact:true,why:'They develop at known rates for each temperature.'}
],
casefile:[
 {k:'one',s:'A single piece of evidence usually solves a case.',fact:false,why:'Investigators build a case from many pieces that support each other.'},
 {k:'chain',s:'Every hand that touches evidence must be recorded.',fact:true,why:'That is chain of custody. Without it, evidence can be thrown out in court.'},
 {k:'bias',s:'Knowing other case details can bias a forensic examiner.',fact:true,why:'Studies show examiners can be swayed by context, so some labs hide extra information.'}
],
facematch:[
 {k:'perfect',s:'Face recognition systems are always right.',fact:false,why:'They give a likelihood. Wrong matches have led to wrongful arrests, such as Robert Williams in Detroit in 2020.'},
 {k:'groups',s:'Some face recognition systems have made more errors for some groups of people.',fact:true,why:'A 2019 NIST study found higher false-match rates for some demographic groups in many algorithms.'},
 {k:'lead',s:'A face match should be treated as a lead, not proof.',fact:true,why:'Investigators still need other evidence.'}
],
binary:[
 {k:'bits',s:'Everything on a computer, photos and songs included, is stored as 1s and 0s.',fact:true,why:'Bits are grouped and interpreted: as numbers, letters, colors or sound samples.'},
 {k:'byte',s:'A byte is 8 bits.',fact:true,why:'One byte can hold 256 different values, 0 to 255.'},
 {k:'ten',s:'Computers count in base 10 like we do.',fact:false,why:'They use base 2. Hexadecimal (base 16) is a shorthand people use to read them.'}
],
filesig:[
 {k:'ext',s:'Changing a file’s extension changes what kind of file it is.',fact:false,why:'The first bytes of the file, its signature, still show its real type. A .jpg starts with FF D8 FF.'},
 {k:'pdf',s:'A PDF file starts with the characters %PDF.',fact:true,why:'Investigators check signatures to find files that are disguised.'},
 {k:'hex',s:'Two hex digits stand for one byte.',fact:true,why:'Each hex digit is 4 bits.'}
],
hashing:[
 {k:'change',s:'Changing one letter in a file completely changes its hash.',fact:true,why:'A good hash function scrambles the whole output, so any edit shows up.'},
 {k:'reverse',s:'You can turn a hash back into the original file.',fact:false,why:'Hashes are one-way. That is why investigators use them to prove a copy is unchanged.'},
 {k:'custody',s:'Hashing a drive copy proves it matches the original evidence.',fact:true,why:'If both hashes match, nothing was altered.'}
],
recovery:[
 {k:'gone',s:'Deleting a file erases its data right away.',fact:false,why:'Usually the space is only marked as free. The data stays until something overwrites it.'},
 {k:'ssd',s:'Deleted files are harder to recover from SSDs than from old hard drives.',fact:true,why:'SSDs often clear freed blocks automatically (TRIM).'},
 {k:'trash',s:'Emptying the trash makes a file unrecoverable.',fact:false,why:'Recovery tools can often find it until the space is reused.'}
],
metadata:[
 {k:'photo',s:'A phone photo can hold the time and GPS location it was taken.',fact:true,why:'That is EXIF metadata. Many apps strip it when sharing, but not all.'},
 {k:'none',s:'A file holds only what you can see on the screen.',fact:false,why:'Files often carry hidden data: author, edit times and device details.'},
 {k:'time',s:'File timestamps can help build a timeline of what happened.',fact:true,why:'Created, modified and accessed times show when files were used, though they can be changed.'}
],
internet:[
 {k:'packets',s:'Data online is broken into small packets that can take different routes.',fact:true,why:'They are put back in order at the destination.'},
 {k:'wifi',s:'Wi-Fi and the internet are the same thing.',fact:false,why:'Wi-Fi connects your device to a local router. The internet is the worldwide network the router connects to.'},
 {k:'dns',s:'DNS turns names like google.com into IP addresses.',fact:true,why:'It works like a phone book for the internet.'}
],
firewall:[
 {k:'all',s:'A firewall stops every kind of attack.',fact:false,why:'It filters network traffic by rules. It can’t stop someone from clicking a phishing link.'},
 {k:'deny',s:'A safe firewall setup blocks everything except what is needed.',fact:true,why:'That is “default deny.” Fewer open doors means fewer ways in.'},
 {k:'order',s:'The order of firewall rules matters.',fact:true,why:'Many firewalls use the first rule that matches.'}
],
logs:[
 {k:'pattern',s:'Many failed logins in a row can be a sign of an attack.',fact:true,why:'It may be someone guessing passwords. Logs make the pattern visible.'},
 {k:'ignore',s:'Logs are only useful after an attack is over.',fact:false,why:'Watching them can catch an attack while it is happening.'},
 {k:'time',s:'Matching timestamps across logs helps reconstruct what happened.',fact:true,why:'Events from different systems line up into one timeline.'}
],
passwords:[
 {k:'long',s:'A long passphrase of random words can be stronger than a short password with symbols.',fact:true,why:'Each added character multiplies the guesses needed. Length beats complexity.'},
 {k:'reuse',s:'Reusing a strong password on many sites is safe.',fact:false,why:'If one site leaks it, attackers try it everywhere. Use a password manager.'},
 {k:'mfa',s:'Multi-factor authentication blocks most account takeover attempts.',fact:true,why:'A stolen password alone isn’t enough to get in.'}
],
phishing:[
 {k:'look',s:'A phishing email always has obvious spelling mistakes.',fact:false,why:'Many look professional. Check the real sender address and where links actually go.'},
 {k:'urgent',s:'Pressure to act fast is a common sign of phishing.',fact:true,why:'Urgency keeps you from stopping to check.'},
 {k:'hover',s:'Hovering over a link shows where it really goes.',fact:true,why:'The visible text can say one thing while the link goes somewhere else.'}
],
pubkey:[
 {k:'lock',s:'On a website with HTTPS, your data is encrypted as it travels.',fact:true,why:'Others on the network can’t read it. It doesn’t mean the site itself is trustworthy.'},
 {k:'share',s:'You should keep your public key secret.',fact:false,why:'The public key is meant to be shared. The private key must stay secret.'},
 {k:'pair',s:'Something encrypted with a public key can be decrypted only with the matching private key.',fact:true,why:'That is how strangers can send you secrets safely.'}
],
stego:[
 {k:'hide',s:'A message can be hidden inside an ordinary-looking image.',fact:true,why:'Changing the last bit of each pixel’s color is invisible to the eye. That is steganography.'},
 {k:'same',s:'Steganography and encryption are the same thing.',fact:false,why:'Encryption scrambles a message; steganography hides that a message exists at all.'},
 {k:'caesar',s:'A Caesar cipher is easy to break.',fact:true,why:'There are only 25 shifts to try, and letter frequencies give it away.'}
],
risk:[
 {k:'layers',s:'Defense in depth means using several layers of protection.',fact:true,why:'If one layer fails, another can still stop the attack.'},
 {k:'zero',s:'A business can make its risk zero.',fact:false,why:'Risk can be lowered, transferred or accepted, never fully removed.'},
 {k:'backup',s:'Offline backups help a business recover from ransomware.',fact:true,why:'Ransomware can’t encrypt a copy it can’t reach.'}
]
});
