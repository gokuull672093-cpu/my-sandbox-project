# Seller desk sidebar, report charts, and deal pricing

## What will change
- Replace the seller desk's horizontal menu with a Zoho-inspired collapsible left sidebar on desktop and an accessible slide-out menu on phones.
- Keep the seller desk light and neutral, with compact navigation, clearer active states, and a practical top bar.
- Correct the Reports chart scale so bars stay inside the chart, improve mobile/desktop readability, and use distinct blue, teal, green, violet, and rose report colors instead of orange.
- Show three Deal Store price levels clearly: MRP and normal selling price both struck out, followed by the final deal price.
- Apply the same three-price presentation in the customer Deal Store strip and seller Deal Store queue.

## Technical details
- Reuse the existing sidebar controls and semantic sidebar/chart color tokens.
- Keep deal-cart calculations unchanged: the final deal price remains the enquiry item's actual price, while MRP remains its savings baseline.
- Scale daily chart heights against the maximum value across page views, cart additions, and enquiries, with a minimum visible height only for non-zero values.
- Preserve all existing seller routes, authentication, and data queries.

## Verification
- Run the TypeScript check.
- Check `/reports` on desktop and mobile to confirm no chart overflow and usable sidebar behavior.
- Check `/enquiry` to confirm Deal Store displays both crossed-out prices and adds the deal price to the enquiry.
