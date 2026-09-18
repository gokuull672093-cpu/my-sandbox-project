# Sparkler Stack

1. First: define exactly what Upcurv is building

I would name the product internally:

Upcurv Crackers Enquiry

Not:

Online Crackers Store

Not:

Crackers E-commerce

Instead:

Digital Catalogue & Enquiry Management System for Licensed Fireworks Sellers

The core workflow is:

Customer discovers products → adds products to enquiry cart → submits enquiry → seller receives enquiry → seller manually contacts customer → seller confirms availability/price/pickup/delivery where legally permitted → seller completes sale offline.

That distinction should exist throughout the UI.

2. What I found in existing Tamil Nadu/Sivakasi stores

I looked at several examples including Sivakasi Enterprises, Shop Crackers Online, i-crackers, Top Crackers, VRS Crackers, Deva Pattasu and others.

Common pattern #1 — Huge product catalogue

They have hundreds of products divided into categories such as:

 Sparklers

 Ground chakkars

 Flower pots

 Rockets

 One-sound crackers

 Fancy items

 Bombs

 Gift boxes

 Combos

For example, Top Crackers exposes a large catalogue with category-wise products and quantity inputs, while Deva Pattasu similarly exposes product categories with discount pricing.

Problem

The customer has to understand crackers terminology.

A normal family customer doesn't necessarily know:

“Which 5 products should I buy for ₹2,000?”

That's an opportunity.

3. The biggest novelty: don't make customers shop only by product

This should become one of our major differentiators.

Instead of only:

Categories → Products → Cart

give customers:

“What are you looking for?”

🎇 I want a ₹1,000 celebration

🎆 I want a ₹2,500 family pack

✨ I want mostly colourful crackers

👨‍👩‍👧 I need a family-friendly selection

🎁 I want a Diwali gift box

💰 I want maximum variety within my budget

🛒 I already know what I want

Then guide them.

This is not automated selling of fireworks; it's a catalogue discovery and enquiry experience.

4. The system should have TWO experiences

This is very important.

Customer side

Think:

Instagram + Amazon-like catalogue + WhatsApp enquiry

But without online checkout/payment.

Seller side

Think:

Mini CRM + order desk + inventory + enquiry management

This is where Upcurv can be much better than existing websites.

5. CUSTOMER SYSTEM

A. Home page

The home page should immediately communicate:

🎇 Diwali Crackers 2026

Browse the catalogue. Build your enquiry. We'll contact you to confirm availability and order details.

Buttons:

Browse Crackers

Build My Diwali Box

View Combos

Send Enquiry

B. Important legal notice

Don't hide the legal nature in the footer.

Put a clear small notice:

Enquiry Only: This website is a digital catalogue and enquiry platform. Submitting an enquiry does not constitute a confirmed sale or payment. Our team will contact you to confirm availability, applicable terms, and order fulfilment.

And:

Fireworks are sold/handled only in accordance with applicable laws, licences and safety requirements.

The exact legal wording should ultimately be reviewed by the seller's legal/compliance adviser.

This is important because fireworks are regulated goods. PESO's materials cover licensing for possession/sale and authorized fireworks, while its FAQ notes specific licensing requirements under the Explosives Rules.

6. PRODUCT CATALOGUE

Each product card should contain:

Product image

Product name

Tamil name

Category

Pack size

MRP/reference price, if applicable

Seller's indicative price

Discount, if seller chooses to show it

Availability status

Quantity selector

Add to Enquiry

But don't overload the card.

8. THE ENQUIRY CART

This is the heart of the product.

Call it:

My Diwali Enquiry

rather than:

Shopping Cart

Example:

ProductQtyIndicative amountSparkler5₹XXXFlower Pot3₹XXXFancy2₹XXX

Then:

Estimated catalogue value

₹2,450

And prominently:

Final availability, pricing and fulfilment will be confirmed by our team.

Button:

Send Enquiry

9. DON'T FORCE LOGIN

This is extremely important for conversion.

Customer should be able to submit an enquiry with:

Name

Mobile number

Area / City

Preferred fulfilment method

Preferred contact method

Optional message

That's it.

Don't make them:

Create account → verify email → login → checkout.

That will kill seasonal conversions.

10. Smart enquiry form

After clicking Send Enquiry:

Tell us about your requirement

Name*

Mobile number*

City / Area*

How would you like to proceed?

○ Shop pickup

○ Seller will contact me regarding available options

○ Other / discuss with seller

Don't present delivery as universally available.

The seller should configure what they legally support.

11. Enquiry confirmation

After submission:

🎆 Enquiry Received!

Enquiry ID: UC-26-10482

We've received your selected products.

What happens next?

1. Our team reviews your enquiry

↓

2. We contact you

↓

3. Availability and pricing are confirmed

↓

4. Order/fulfilment is arranged according to applicable requirements

This is much more professional than:

“Thanks, we will contact you.”

12. WhatsApp integration

This is essential for Tamil Nadu.

After submission:

Prefer WhatsApp?

Chat with our team

Generate a structured message:

Hi, I submitted enquiry UC-26-10482.
Name: Gokul
Area: Coimbatore
Products: 8 items
Estimated catalogue value: ₹2,450

The seller can continue the conversation manually.

This is basically converting the website into a lead-generation engine for the shop.

13. Seller dashboard

This is where Upcurv should beat existing crackers websites.

Dashboard:

Today's overview

New Enquiries: 27

Pending Calls: 14

Confirmed: 9

Follow-up: 8

Cancelled: 3

Estimated Enquiry Value: ₹XX,XXX

14. Enquiry pipeline

Use a Kanban-style pipeline:

NEW

Customer submitted enquiry.

↓

CONTACT REQUIRED

Seller needs to call.

↓

CONTACTED

Customer reached.

↓

DISCUSSION

Availability/pricing being discussed.

↓

CONFIRMED

Seller confirmed the order offline.

↓

READY

Order prepared.

↓

COMPLETED

Customer received/picked up.

And:

NOT CONVERTED

Customer didn't proceed.

This is a mini CRM specifically designed for the Diwali season.

15. Enquiry detail page

When seller opens an enquiry:

Customer

Gokul Anand

📞 63807XXXXX

Coimbatore

Requested products

12 products

₹4,820 indicative value

Seller actions

Call Customer

WhatsApp Customer

Mark Contacted

Confirm

Request Changes

Follow Up

Close Enquiry

Internal notes

Customer wants family combo.

Call after 6 PM.

2 products unavailable.

This will be extremely useful during peak season.

16. VERY IMPORTANT — DON'T TREAT ENQUIRY AS ORDER

Database should have separate entities:

Enquiry

Customer's request.

Quotation / Confirmation

Seller's manually confirmed commercial proposal.

Order

Only after seller has actually accepted/confirmed it according to their process.

This prevents your system from falsely representing:

“Customer bought ₹5,000 worth of fireworks.”

when they only submitted a request.

17. Seller can modify the enquiry

This is another excellent feature.

Customer asks for:

“₹5,000 family collection.”

Seller sees 15 requested products.

But 3 aren't available.

Seller can modify:

 Remove unavailable items

 Change quantity

 Add alternative products

 Adjust price

 Add seller-specific notes

Then generate:

Quotation / Confirmation Summary

The customer receives it through WhatsApp.

This is much better than the current:

Customer submits cart → phone call → everything manually remembered.

18. Product availability system

Don't necessarily expose exact inventory to customers.

Instead give seller:

Availability

🟢 Available

🟡 Limited

🔴 Unavailable

⚪ Enquiry only

Customer sees:

Available

Limited availability

or

Ask availability

This prevents customers from assuming a displayed item is guaranteed.

19. Seasonal inventory

The seller can upload their catalogue through:

Excel import

This is critical.

A crackers dealer may have 500–1,000 products.

They shouldn't manually enter everything.

Upload:

Product Code | Product Name | Tamil Name | Category | Pack | MRP | Price | Stock | Image

Then Upcurv imports it.

20. Bulk image upload

Another huge time saver.

Seller uploads:

100 product images

System matches images using product code/name where possible.

This can drastically reduce onboarding time.

21. Product code system

Every product gets:

CRK-001

CRK-002

etc.

Seller can search:

CRK-142

or:

Lakshmi

or:

4 inch

This becomes very useful when they're handling phone calls.

Customer:

“I need that 4-inch Lakshmi.”

Seller can instantly locate it.

22. THE BIG NOVELTY — “BUILD MY DIWALI BOX”

This is the feature I would put prominently on the homepage.

Customer enters:

My budget

₹1,000

₹2,000

₹3,000

₹5,000

₹10,000+

Then:

What type?

☑ Family

☑ Children/family-friendly selection

☑ Colourful

☑ Variety

☑ Premium

☑ Traditional

The system produces a suggested catalogue collection from products configured by the seller.

Then:

Add Entire Selection to Enquiry

This can dramatically simplify shopping.

Important: frame it as a seller-configured collection/catalogue, not the platform independently recommending regulated fireworks.

23. COMBO BUILDER

Seller can create:

🎇 Family Combo — ₹2,999 indicative

Contains:

 Product A

 Product B

 Product C

 Product D

Customer clicks:

View Combo

Then:

Add Combo to Enquiry

Existing crackers stores already heavily use combos/gift boxes, so this isn't itself novel; our advantage is making the combo experience much more structured and personalized.

24. Another strong feature: “SHOP BY EXPERIENCE”

Instead of only technical categories:

🎆 Sky & Aerial

✨ Sparkle & Light

🌈 Colourful

🪔 Traditional

🎁 Gift Packs

👨‍👩‍👧 Family Collections

💎 Premium Collection

This makes the catalogue understandable to ordinary customers.

25. Tamil + English

For Tamil Nadu this should be native, not an afterthought.

Toggle:

தமிழ் | English

Product:

4 Inch Lakshmi

4 இன்ச் லக்ஷ்மி

Customer can browse in Tamil.

Seller dashboard can remain English.

26. Mobile-first design

This isn't optional.

Most customers will arrive from:

WhatsApp → link → mobile browser

So design for:

360–430px width first.

Not desktop first.

27. QR CODE SYSTEM

Every shop gets:

QR code

Scan →

Crackers catalogue →

Build enquiry →

Submit.

Seller can print:

“Scan to view our Diwali catalogue”

and place it:

 At shop entrance

 Counter

 Banner

 Visiting card

 WhatsApp status

 Instagram

 Facebook

 Google Business profile where appropriate

28. Shareable product links

Every product:

/product/4-inch-lakshmi

Every combo:

/combo/family-2999

Every category:

/category/sparklers

So a seller can send:

“This is our ₹3,000 family combo.”

directly to a customer.

29. “Quick Enquiry” for customers who don't want to browse

Existing sites sometimes have quick-order functionality. Shop Crackers Online, for example, advertises a quick order option and WhatsApp chat.

We can improve it.

Customer can type:

Need 10 boxes sparklers, 5 flower pots and family combo around 3000.

Submit.

Seller gets:

Free-text enquiry

Then calls the customer.

30. Seller-side “Call Mode”

This could be very useful during Diwali rush.

Imagine the salesperson receives:

27 pending enquiries

Open one.

Large buttons:

📞 Call

💬 WhatsApp

✓ Contacted

✓ Confirmed

↩ Follow-up

No complicated CRM.

The entire interface should be optimized for a shop employee working quickly.

31. Follow-up system

This is another place where Upcurv can generate value.

Customer didn't answer.

Seller clicks:

Follow-up tomorrow

System shows:

Follow-ups Today

10:00 — Ravi

11:30 — Kumar

3:00 — Priya

etc.

This prevents leads from disappearing.

32. Customer enquiry tracking

Give customer a link:

Track Enquiry

shopname.upcurv.in/e/UC2610482

Status:

Enquiry Received ✓

Team Contacted ✓

Confirmation Pending

Confirmed

Completed

Again, don't call this order tracking until there is actually a confirmed order.

33. Seller analytics

After the season:

Enquiries

1,284

Enquiry value

₹18.4L

Confirmed

642

Conversion

50%

Average confirmed value

₹2,865

Top category

Family Combos

Top products

...

This is enormously valuable to the seller.

Most existing simple crackers websites are basically catalogues, not operational systems. Their pages focus heavily on products, discounts, minimum order values and WhatsApp/contact instructions.

34. Source tracking

This is a fantastic feature for merchants.

Every enquiry records:

Source

 WhatsApp

 Instagram

 Facebook

 Google

 QR

 Direct

 Referral

Seller can discover:

Instagram → 214 enquiries
WhatsApp → 480
QR → 162
Google → 97

Now you're giving them marketing intelligence, not just a website.

35. Marketing campaign links

Seller can generate:

WhatsApp campaign

?source=whatsapp

Instagram campaign

?source=instagram

QR campaign

?source=qr

Then dashboard tells them which channel generates enquiries.

That's a very strong SaaS feature.

this is only one store shop, noot multi tenant, only one login account for admin alone, no public login needed, dont have product detailed page because it is not necessary, not too much fields for products keep it minimal, neat and good ui, white as primary and some other color as secondary keep it, have proper shimmer loaders on placeholders, store info like name, contacts, logos, address, these must be added in code only directly not in settonsg of seller

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cracker-whisperer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f1f688e3-44c1-46c4-8d69-94415169f75a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
