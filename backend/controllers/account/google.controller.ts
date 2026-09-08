import { Customer, ErrorLog } from '../../models/index.ts';
import { encryptPassword, generateToken } from '../../helpers/security.ts';
import { genTxt } from '../../helpers/util.ts';

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';

export async function signin(req, res) {
  try {
    const idToken = String(req.body?.idToken || '').trim();
    if (!idToken) throw { message: 'Google ID token is required.' };

    const response = await fetch(`${GOOGLE_TOKENINFO_URL}${encodeURIComponent(idToken)}`);
    if (!response.ok) throw { message: 'Google ID token is invalid.' };
    const profile: any = await response.json();
    if (profile.email_verified !== 'true' || !profile.email) {
      throw { message: 'Google account email is not verified.' };
    }
    if (process.env.GOOGLE_WEB_CLIENT_ID && profile.aud !== process.env.GOOGLE_WEB_CLIENT_ID) {
      throw { message: 'Google ID token audience is invalid.' };
    }

    const email = String(profile.email).toLowerCase();
    let customer: any = await Customer.findOne({ where: { email } });
    if (!customer) {
      customer = await Customer.create({
        firstname: profile.given_name || profile.name || 'Google',
        lastname: profile.family_name || 'Customer',
        display_name: profile.name || email,
        email,
        profile_image_url: profile.picture || null,
        password: await encryptPassword(genTxt(32)),
        active: true,
        authData: JSON.stringify({ provider: 'google', subject: profile.sub }),
      });
    } else if (!customer.active) {
      await customer.update({ active: true });
    }

    const token = await generateToken(email, req.hostname);
    return res.status(200).json({
      user: { id: customer.id, firstname: customer.firstname, lastname: customer.lastname, email },
      _token: token,
    });
  } catch (err: any) {
    const message = typeof err === 'string' ? err : err?.message || 'Google sign-in failed.';
    await ErrorLog.create({ location: 'google.controller.signin', message });
    return res.status(401).json({ message });
  }
}
