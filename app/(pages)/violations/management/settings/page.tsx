import { SettingsPage } from '@/app/pagesLayer/SettingsPage';
import { ActivityLog } from '@/featuresLayer/ActivityLog';

// The journals of the gate: what the operators did, when they signed in and which pages they opened.
// The language and the theme are changed on the other settings pages.
const Settings = () => {
  return (
    <SettingsPage showSwitchers={false}>
      <ActivityLog />
    </SettingsPage>
  );
};

export default Settings;
