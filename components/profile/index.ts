// Profile components
export { ProfileHeader } from './ProfileHeader';
export { ProfileAbout } from './ProfileAbout';
export { ProfileProjects } from './ProfileProjects';
export { ProfileEditorForm } from './ProfileEditorForm';
export { FollowButton, PresenceIndicator } from './FollowButton';
export { NotificationSettings } from './NotificationSettings';
export { IntegrationsPanel } from './IntegrationsPanel';
export { CodingDashboard } from './CodingDashboard';
export { GitHubHeatmap } from './GitHubHeatmap';
export { LevelProgressBar } from './LevelProgressBar';
export { SkillsAndTags } from './SkillsAndTags';
export { StudentCard } from './StudentCard';

// Discord-style profile interaction components
export { MiniProfileCard } from './MiniProfileCard';
export { FullProfileModal } from './FullProfileModal';
export { SpotifyNowPlaying } from './SpotifyNowPlaying';
export { ProfileTrigger } from './ProfileTrigger';

// Profile Popout System (Global)
export {
    ProfilePopoutProvider,
    useProfilePopout,
    ProfileClickable
} from './ProfilePopoutProvider';
