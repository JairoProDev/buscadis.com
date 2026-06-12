import {
  FaTimes, FaChevronLeft, FaChevronRight, FaCopy, FaShare, FaWhatsapp, FaCheck, FaSearch,
  FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaHome, FaCar, FaWrench, FaBox, FaCalendarCheck,
  FaBuilding, FaUsers, FaTh, FaHeading, FaAlignLeft, FaPhone, FaBullhorn, FaMap, FaComments,
  FaGift, FaFileAlt, FaEdit, FaTrash, FaExternalLinkAlt, FaShieldAlt, FaMedal, FaClock,
  FaUserCheck, FaStar, FaStore, FaInstagram, FaFacebook, FaTiktok, FaGlobe, FaPhoneAlt,
  FaEnvelope, FaShareAlt, FaCheckCircle, FaChevronDown, FaHeart, FaArrowLeft, FaRobot,
  FaHandHoldingHeart, FaPlus, FaImage, FaSpinner, FaEye, FaTags, FaExclamationTriangle,
  FaInfoCircle, FaQrcode, FaRegHeart, FaMicrophone, FaLinkedin, FaYoutube,
  FaFile, FaCamera, FaTable, FaUpload, FaList, FaFilter, FaMapPin, FaShoppingCart, FaMagic, FaMinus,
  FaFileExcel, FaDownload, FaLightbulb, FaSyncAlt, FaBolt, FaTag, FaEyeSlash, FaLayerGroup, FaSquare,
  FaSort, FaSortAmountDown, FaSortAmountUp
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { MdCenterFocusWeak } from 'react-icons/md';
import { IoCloseOutline } from 'react-icons/io5';

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
export const IconArrowRight = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconChevronRight = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconChevronDown = (p: IconProps) => <FaChevronDown size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
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
export const IconEdit = (p: IconProps) => <FaEdit size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTrash = (p: IconProps) => <FaTrash size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconExternalLink = (p: IconProps) => <FaExternalLinkAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconHeart = (p: IconProps) => <FaHeart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconHeartOutline = (p: IconProps) => <FaRegHeart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
/** Contorno fino, mismo peso visual que IconHeartOutline en cards. */
export const IconDismiss = (p: IconProps) => <IoCloseOutline size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
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
export const IconChatbot = (p: IconProps) => <FaComments size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconShield = (p: IconProps) => <FaShieldAlt size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMedal = (p: IconProps) => <FaMedal size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUserCheck = (p: IconProps) => <FaUserCheck size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconQrcode = (p: IconProps) => <FaQrcode size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGoogle = (p: IconProps) => <FcGoogle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMicrophone = (p: IconProps) => <FaMicrophone size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGoogleLens = (p: IconProps) => <MdCenterFocusWeak size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMinimize = (p: IconProps) => <FaChevronRight size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconExpand = (p: IconProps) => <FaChevronLeft size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPlus = (p: IconProps) => <FaPlus size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconImage = (p: IconProps) => <FaImage size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFile = (p: IconProps) => <FaFile size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconCamera = (p: IconProps) => <FaCamera size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconTable = (p: IconProps) => <FaTable size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconUpload = (p: IconProps) => <FaUpload size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconX = (p: IconProps) => <FaTimes size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconSparkles = (p: IconProps) => <FaMagic size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconPackage = (p: IconProps) => <FaBox size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconGrid = (p: IconProps) => <FaTh size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconList = (p: IconProps) => <FaList size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFeed = (p: IconProps) => <FaSquare size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFilter = (p: IconProps) => <FaFilter size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMapPin = (p: IconProps) => <FaMapPin size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconShoppingCart = (p: IconProps) => <FaShoppingCart size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconMinus = (p: IconProps) => <FaMinus size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconAlertTriangle = (p: IconProps) => <FaExclamationTriangle size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconFileSpreadsheet = (p: IconProps) => <FaFileExcel size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
export const IconDownload = (p: IconProps) => <FaDownload size={getSize(p)} color={p.color || 'currentColor'} className={p.className} onClick={p.onClick} />;
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
