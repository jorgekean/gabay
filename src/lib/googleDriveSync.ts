import { db } from '../services/db';

const FILENAME = 'gabay_backup.json';
const MIME_TYPE = 'application/json';

export async function exportDataToJson(): Promise<string> {
  const students = await db.students.toArray();
  const incidents = await db.incidents.toArray();

  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {
      students,
      incidents,
    }
  };

  return JSON.stringify(exportData, null, 2);
}

export async function syncToGoogleDrive(accessToken: string): Promise<boolean> {
  try {
    const metadata = {
      name: FILENAME,
      mimeType: MIME_TYPE
    };

    // 1. Search for existing file
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILENAME}' and trashed=false&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!searchRes.ok) throw new Error('Failed to search Drive');

    const searchData = await searchRes.json();
    const files = searchData.files;
    
    const jsonContent = await exportDataToJson();
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([jsonContent], { type: MIME_TYPE }));

    if (files && files.length > 0) {
      const fileId = files[0].id;

      // UPDATE existing file
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form
        }
      );

      return updateRes.ok;
    } else {
      // Create new file
      const createRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form
        }
      );

      return createRes.ok;
    }
  } catch (error) {
    console.error('Google Drive Sync Error:', error);
    return false;
  }
}
