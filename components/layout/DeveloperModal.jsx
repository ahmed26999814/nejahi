"use client";

import { m } from "framer-motion";
import { FaFacebookF, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { contentValue } from "../common/content";
import { HomeIcon, MessageIcon, UserIcon, XIcon } from "../common/icons";

export default function DeveloperModal({ content = {}, onClose, text }) {
  const avatar = contentValue(content, "developer_avatar");
  const background = contentValue(content, "developer_background");
  const name = contentValue(content, "developer_name", "Ahmed abdellahi mady");
  const role = contentValue(content, "developer_job_title", text.developerRole);
  const description = contentValue(content, "developer_description", text.developerMessage);
  const supportMessage = contentValue(content, "developer_support_message");
  const whatsapp = contentValue(content, "developer_whatsapp", "https://wa.me/22244881891");
  const facebook = contentValue(content, "developer_facebook", "https://www.facebook.com/ahmed.abde.mady");
  const telegram = contentValue(content, "developer_telegram");
  const website = contentValue(content, "developer_website");
  const email = contentValue(content, "developer_email");

  return (
    <div className="developer-modal-backdrop" role="dialog" aria-modal="true" aria-label={text.preparedBy}>
      <m.article className="developer-modal" initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.24, ease: "easeOut" }}>
        {background && <img className="developer-modal-bg" src={background} alt="" loading="lazy" />}
        <button className="developer-close" onClick={onClose} type="button" aria-label={text.close}>
          <XIcon />
        </button>
        <div className="developer-avatar">
          {avatar ? <img src={avatar} alt={name} loading="lazy" /> : <UserIcon />}
        </div>
        <p className="text-[11px] font-black text-mauri-gold">{text.preparedBy}</p>
        <h3 className="mt-1 text-2xl font-black text-white">{name}</h3>
        <p className="mt-1 text-sm font-black text-emerald-100">{role}</p>
        <p className="mt-4 text-sm font-bold leading-7 text-white/80">{description}</p>
        {supportMessage && <p className="mt-3 rounded-[18px] border border-white/15 bg-white/10 p-3 text-sm font-bold leading-7 text-white/85">{supportMessage}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {whatsapp && <a className="developer-modal-link" href={whatsapp} target="_blank" rel="noopener"><FaWhatsapp />{text.whatsapp}</a>}
          {facebook && <a className="developer-modal-link" href={facebook} target="_blank" rel="noopener"><FaFacebookF />{text.facebook}</a>}
          {telegram && <a className="developer-modal-link" href={telegram} target="_blank" rel="noopener"><FaTelegram />{text.telegram}</a>}
          {website && <a className="developer-modal-link" href={website} target="_blank" rel="noopener"><HomeIcon />Website</a>}
          {email && <a className="developer-modal-link" href={`mailto:${email}`}><MessageIcon />Email</a>}
        </div>
      </m.article>
    </div>
  );
}
