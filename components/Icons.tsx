import {
  FaTimes, FaChevronLeft, FaChevronRight, FaCopy, FaShare, FaWhatsapp, FaCheck, FaSearch,
  FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaHome, FaCar, FaWrench, FaBox, FaCalendarCheck,
  FaBuilding, FaUsers, FaTh, FaHeading, FaAlignLeft, FaPhone, FaBullhorn, FaMap, FaComments,
  FaGift, FaFileAlt, FaEdit, FaTrash, FaExternalLinkAlt, FaShieldAlt, FaMedal, FaClock,
  FaUserCheck, FaStar, FaStore, FaInstagram, FaFacebook, FaTiktok, FaGlobe, FaPhoneAlt,
  FaEnvelope, FaShareAlt, FaCheckCircle, FaChevronDown, FaHeart, FaArrowLeft, FaRobot,
  FaHandHoldingHeart, FaPlus, FaImage, FaSpinner, FaEye, FaTags, FaExclamationTriangle,
  FaInfoCircle, FaRegHeart, FaMicrophone, FaLinkedin, FaYoutube,
  FaFile, FaCamera, FaTable, FaUpload, FaList, FaFilter, FaMapPin, FaShoppingCart, FaMagic, FaMinus, FaChevronUp,
  FaFileExcel, FaDownload, FaLightbulb, FaSyncAlt, FaBolt, FaTag, FaEyeSlash, FaLayerGroup, FaSquare,
  FaSort, FaSortAmountDown, FaSortAmountUp, FaVideo, FaPaperPlane, FaBell, FaMoon, FaSun, FaUser, FaHandPointUp,
  FaCog, FaSignOutAlt, FaCompass, FaUserTie, FaUserCog, FaUserEdit, FaEllipsisV,
  FaHandshake, FaUserPlus, FaUndo, FaRedo, FaCrop, FaPencilAlt, FaSmile,
  FaBed, FaBath, FaRulerCombined, FaCouch, FaKey, FaTree, FaWifi, FaGasPump, FaCogs,
  FaTachometerAlt, FaBicycle, FaTshirt, FaUtensils, FaGraduationCap, FaLaptop, FaPaw,
  FaExchangeAlt, FaTruck, FaDoorOpen, FaTicketAlt, FaWeightHanging, FaCoins
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { MdCenterFocusWeak } from 'react-icons/md';
import { RiMotorbikeFill } from 'react-icons/ri';
import QrMinimalIcon from '@/components/icons/QrMinimalIcon';

/**
 * Icons Registry
 * Centrally managed icon components with consistent sizing and coloring.
 */

interface IconProps {
  width?: number;
  height?: number;
  size?: number;
  color?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<SVGElement>) => void;
}

const getSize = (props: IconProps): number => {
  return props.size || props.width || 18;
};

// UI & Navigation
export const IconClose = (p: IconProps) => <FaTimes size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconArrowLeft = (p: IconProps) => <FaChevronLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconChevronLeft = (p: IconProps) => <FaChevronLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUndo = (p: IconProps) => <FaUndo size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconRedo = (p: IconProps) => <FaRedo size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconArrowRight = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconChevronRight = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconChevronDown = (p: IconProps) => <FaChevronDown size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconChevronUp = (p: IconProps) => <FaChevronUp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSearch = (p: IconProps) => <FaSearch size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCheck = (p: IconProps) => <FaCheck size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconVerified = (p: IconProps) => <FaCheckCircle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconClock = (p: IconProps) => <FaClock size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCalendar = (p: IconProps) => <FaCalendarAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMapMarkerAlt = (p: IconProps) => <FaMapMarkerAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconLocation = (p: IconProps) => <FaMapMarkerAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEye = (p: IconProps) => <FaEye size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

// Action Icons
export const IconCopy = (p: IconProps) => <FaCopy size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconShare = (p: IconProps) => <FaShare size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconShareAlt = (p: IconProps) => <FaShareAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSend = (p: IconProps) => <FaPaperPlane size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconBell = (p: IconProps) => <FaBell size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMoon = (p: IconProps) => <FaMoon size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSun = (p: IconProps) => <FaSun size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUser = (p: IconProps) => <FaUser size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
/** Silueta rellena gruesa — legible a distancia en móvil */
export const IconMotorcycle = (p: IconProps) => (
  <RiMotorbikeFill size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />
);
export const IconDelivery = IconMotorcycle;
export const IconInfluencer = (p: IconProps) => <FaHandshake size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUserPlus = (p: IconProps) => <FaUserPlus size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSettings = (p: IconProps) => <FaCog size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSignOut = (p: IconProps) => <FaSignOutAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconExplore = (p: IconProps) => <FaCompass size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconHome = (p: IconProps) => <FaHome size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMessages = (p: IconProps) => <FaComments size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconOwner = (p: IconProps) => <FaUserTie size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconBusinessAdmin = (p: IconProps) => <FaUserCog size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEditor = (p: IconProps) => <FaUserEdit size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEdit = (p: IconProps) => <FaEdit size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTrash = (p: IconProps) => <FaTrash size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconExternalLink = (p: IconProps) => <FaExternalLinkAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconHeart = (p: IconProps) => <FaHeart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconHeartOutline = (p: IconProps) => <FaRegHeart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
/** X en contorno — stroke calibrado para emparejar FaRegHeart en cards. */
export const IconDismiss = (p: IconProps) => {
  const size = getSize(p);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={p.color || 'currentColor'}
      strokeWidth="2.25"
      strokeLinecap="round"
      className={p.className}
      onClick={p.onClick}
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
};
export const IconStar = (p: IconProps) => <FaStar size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFileAlt = (p: IconProps) => <FaFileAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconAdiso = (p: IconProps) => <FaFileAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

// Business & Categories
export const IconStore = (p: IconProps) => <FaStore size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconBox = (p: IconProps) => <FaBox size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGratuitos = (p: IconProps) => <FaGift size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTodos = (p: IconProps) => <FaTh size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMegaphone = (p: IconProps) => <FaBullhorn size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconRobot = (p: IconProps) => <FaRobot size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEmpleos = (p: IconProps) => <FaBriefcase size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconInmuebles = (p: IconProps) => <FaHome size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconVehiculos = (p: IconProps) => <FaCar size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconServicios = (p: IconProps) => <FaWrench size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconProductos = (p: IconProps) => <FaGift size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEventos = (p: IconProps) => <FaCalendarAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconNegocios = (p: IconProps) => <FaStore size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconComunidad = (p: IconProps) => <FaUsers size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

// Social & Contact
export const IconWhatsapp = (p: IconProps) => <FaWhatsapp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconWhatsApp = (p: IconProps) => <FaWhatsapp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconInstagram = (p: IconProps) => <FaInstagram size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFacebook = (p: IconProps) => <FaFacebook size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTiktok = (p: IconProps) => <FaTiktok size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconLinkedin = (p: IconProps) => <FaLinkedin size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconYoutube = (p: IconProps) => <FaYoutube size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGlobe = (p: IconProps) => <FaGlobe size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEnvelope = (p: IconProps) => <FaEnvelope size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPhone = (p: IconProps) => <FaPhoneAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

// Specialized UI
export const IconTitle = (p: IconProps) => <FaHeading size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconDescription = (p: IconProps) => <FaAlignLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMap = (p: IconProps) => <FaMap size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

/** ADIS — icono de ayuda inteligente (destellos, no robot ni chat) */
export const IconAdis = (p: IconProps) => {
  const s = getSize(p);
  const color = p.color || 'currentColor';
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={p.className}
      onClick={p.onClick}
      aria-hidden
    >
      <path
        d="M12 2.5L13.35 9.15L20 10.5L13.35 11.85L12 18.5L10.65 11.85L4 10.5L10.65 9.15L12 2.5Z"
        fill={color}
      />
      <circle cx="18.5" cy="5.5" r="1.35" fill={color} opacity="0.75" />
      <circle cx="5.5" cy="16.5" r="1.1" fill={color} opacity="0.55" />
      <circle cx="19" cy="15" r="0.9" fill={color} opacity="0.45" />
    </svg>
  );
};

export const IconChatbot = IconAdis;
export const IconShield = (p: IconProps) => <FaShieldAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMedal = (p: IconProps) => <FaMedal size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUserCheck = (p: IconProps) => <FaUserCheck size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconQrcode = (p: IconProps) => (
  <QrMinimalIcon size={getSize(p)} className={p.className} onClick={p.onClick} />
);
export const IconGoogle = (p: IconProps) => <FcGoogle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMicrophone = (p: IconProps) => <FaMicrophone size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGoogleLens = (p: IconProps) => <MdCenterFocusWeak size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMinimize = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconExpand = (p: IconProps) => <FaChevronLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPlus = (p: IconProps) => <FaPlus size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconImage = (p: IconProps) => <FaImage size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconVideo = (p: IconProps) => <FaVideo size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFile = (p: IconProps) => <FaFile size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCamera = (p: IconProps) => <FaCamera size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTable = (p: IconProps) => <FaTable size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUpload = (p: IconProps) => <FaUpload size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconX = (p: IconProps) => <FaTimes size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSparkles = (p: IconProps) => <FaMagic size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPackage = (p: IconProps) => <FaBox size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGrid = (p: IconProps) => <FaTh size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconList = (p: IconProps) => <FaList size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconForms = (p: IconProps) => <FaFileAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFeed = (p: IconProps) => <FaSquare size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

/** Vertical video / Shorts-style feed */
export const IconShorts = (p: IconProps) => (
  <svg
    width={getSize(p)}
    height={getSize(p)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={p.color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
    onClick={p.onClick}
  >
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 10v4l3-2-3-2z" fill={p.color || 'currentColor'} stroke="none" />
  </svg>
);
export const IconFilter = (p: IconProps) => <FaFilter size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMapPin = (p: IconProps) => <FaMapPin size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconShoppingCart = (p: IconProps) => <FaShoppingCart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUsers = (p: IconProps) => <FaUsers size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEllipsisV = (p: IconProps) => <FaEllipsisV size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMinus = (p: IconProps) => <FaMinus size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconAlertTriangle = (p: IconProps) => <FaExclamationTriangle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFileSpreadsheet = (p: IconProps) => <FaFileExcel size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconDownload = (p: IconProps) => <FaDownload size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCrop = (p: IconProps) => <FaCrop size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconText = (p: IconProps) => (
  <svg width={getSize(p)} height={getSize(p)} viewBox="0 0 24 24" fill={p.color || 'currentColor'} className={p.className} aria-hidden>
    <path d="M3.5 3.5h17v4.2h-6.2V20.5h-4.6V7.7H3.5V3.5z" />
  </svg>
);
export const IconBed = (p: IconProps) => <FaBed size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconBath = (p: IconProps) => <FaBath size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconRuler = (p: IconProps) => <FaRulerCombined size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCouch = (p: IconProps) => <FaCouch size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconKey = (p: IconProps) => <FaKey size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTree = (p: IconProps) => <FaTree size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconWifi = (p: IconProps) => <FaWifi size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGas = (p: IconProps) => <FaGasPump size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCogs = (p: IconProps) => <FaCogs size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGauge = (p: IconProps) => <FaTachometerAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconBicycle = (p: IconProps) => <FaBicycle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconShirt = (p: IconProps) => <FaTshirt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUtensils = (p: IconProps) => <FaUtensils size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGrad = (p: IconProps) => <FaGraduationCap size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconLaptop = (p: IconProps) => <FaLaptop size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPaw = (p: IconProps) => <FaPaw size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconExchange = (p: IconProps) => <FaExchangeAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTruck = (p: IconProps) => <FaTruck size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconDoor = (p: IconProps) => <FaDoorOpen size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTicket = (p: IconProps) => <FaTicketAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconWeight = (p: IconProps) => <FaWeightHanging size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCoins = (p: IconProps) => <FaCoins size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconBuilding = (p: IconProps) => <FaBuilding size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPen = (p: IconProps) => <FaPencilAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSmile = (p: IconProps) => <FaSmile size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconLightbulb = (p: IconProps) => <FaLightbulb size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconRefresh = (p: IconProps) => <FaSyncAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconZap = (p: IconProps) => <FaBolt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTag = (p: IconProps) => <FaTag size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTags = (p: IconProps) => <FaTags size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconEyeOff = (p: IconProps) => <FaEyeSlash size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconLayers = (p: IconProps) => <FaLayerGroup size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSort = (p: IconProps) => <FaSort size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSortDown = (p: IconProps) => <FaSortAmountDown size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSortUp = (p: IconProps) => <FaSortAmountUp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTouch = (p: IconProps) => <FaHandPointUp size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;

// Custom Filter Icons
export const IconFilterFunnel = (p: IconProps) => (
  <svg
    width={getSize(p)}
    height={getSize(p)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={p.color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
    onClick={p.onClick}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);

export const IconFilterSliders = (p: IconProps) => (
  <svg
    width={getSize(p)}
    height={getSize(p)}
    viewBox="0 0 24 24"
    fill="none"
    stroke={p.color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
    onClick={p.onClick}
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

