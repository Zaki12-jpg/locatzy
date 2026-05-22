import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { listingTitle, amount, from, to } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: listingTitle || "Réservation Locatzy",
              description: from && to ? `Du ${from} au ${to}` : undefined,
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}?paiement=reussi`,
      cancel_url: `${req.headers.origin}?paiement=annule`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.log("Erreur Stripe:", e);
    return res.status(500).json({ error: e.message });
  }
}