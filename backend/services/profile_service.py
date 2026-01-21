import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import create_client, Client

class ProfileService:
    """Service for managing user birth profiles and action logging"""
    
    def __init__(self):
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in environment variables")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    async def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new profile for a user"""
        try:
            # Prepare profile data
            data = {
                'user_id': user_id,
                'profile_name': profile_data.get('profile_name', 'Main Profile'),
                'birth_date': profile_data['birth_date'],
                'birth_time': profile_data.get('birth_time'),
                'birth_place': profile_data.get('birth_place'),
                'birth_lat': profile_data.get('birth_lat'),
                'birth_lng': profile_data.get('birth_lng'),
                'birth_timezone': profile_data.get('birth_timezone'),
                'is_active': profile_data.get('is_active', True)
            }
            
            # If this is the first profile or explicitly set as active, deactivate others
            if data['is_active']:
                await self._deactivate_all_profiles(user_id)
            
            # Insert new profile
            result = self.supabase.table('profiles').insert(data).execute()
            profile = result.data[0] if result.data else None
            
            if profile:
                await self.log_action(
                    user_id=user_id,
                    profile_id=profile['id'],
                    action_type='profile_created',
                    details={'profile_name': data['profile_name']}
                )
            
            return profile
        except Exception as e:
            await self.log_action(
                user_id=user_id,
                profile_id=None,
                action_type='profile_create_failed',
                details={'error': str(e)}
            )
            raise
    
    async def get_active_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the user's currently active profile"""
        try:
            result = self.supabase.table('profiles') \
                .select('*') \
                .eq('user_id', user_id) \
                .eq('is_active', True) \
                .execute()
            
            profile = result.data[0] if result.data else None
            
            if profile:
                await self.log_action(
                    user_id=user_id,
                    profile_id=profile['id'],
                    action_type='profile_loaded',
                    details={'profile_name': profile['profile_name']}
                )
            
            return profile
        except Exception as e:
            await self.log_action(
                user_id=user_id,
                profile_id=None,
                action_type='profile_load_failed',
                details={'error': str(e)}
            )
            return None
    
    async def get_all_profiles(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all profiles for a user"""
        try:
            result = self.supabase.table('profiles') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=False) \
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            await self.log_action(
                user_id=user_id,
                profile_id=None,
                action_type='profiles_list_failed',
                details={'error': str(e)}
            )
            return []
    
    async def switch_profile(self, user_id: str, profile_id: str) -> Optional[Dict[str, Any]]:
        """Switch to a different profile"""
        try:
            # Deactivate all profiles
            await self._deactivate_all_profiles(user_id)
            
            # Activate selected profile
            result = self.supabase.table('profiles') \
                .update({'is_active': True}) \
                .eq('id', profile_id) \
                .eq('user_id', user_id) \
                .execute()
            
            profile = result.data[0] if result.data else None
            
            if profile:
                await self.log_action(
                    user_id=user_id,
                    profile_id=profile_id,
                    action_type='profile_switched',
                    details={'profile_name': profile['profile_name']}
                )
            
            return profile
        except Exception as e:
            await self.log_action(
                user_id=user_id,
                profile_id=profile_id,
                action_type='profile_switch_failed',
                details={'error': str(e)}
            )
            raise
    
    async def update_profile(self, user_id: str, profile_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update profile data"""
        try:
            # Remove fields that shouldn't be updated directly
            updates.pop('id', None)
            updates.pop('user_id', None)
            updates.pop('created_at', None)
            
            result = self.supabase.table('profiles') \
                .update(updates) \
                .eq('id', profile_id) \
                .eq('user_id', user_id) \
                .execute()
            
            profile = result.data[0] if result.data else None
            
            if profile:
                await self.log_action(
                    user_id=user_id,
                    profile_id=profile_id,
                    action_type='profile_updated',
                    details={'updates': list(updates.keys())}
                )
            
            return profile
        except Exception as e:
            await self.log_action(
                user_id=user_id,
                profile_id=profile_id,
                action_type='profile_update_failed',
                details={'error': str(e)}
            )
            raise
    
    async def delete_profile(self, user_id: str, profile_id: str) -> bool:
        """Delete a profile"""
        try:
            # Get profile info before deletion for logging
            profile_result = self.supabase.table('profiles') \
                .select('profile_name') \
                .eq('id', profile_id) \
                .eq('user_id', user_id) \
                .execute()
            
            profile_name = profile_result.data[0]['profile_name'] if profile_result.data else 'Unknown'
            
            # Delete profile
            self.supabase.table('profiles') \
                .delete() \
                .eq('id', profile_id) \
                .eq('user_id', user_id) \
                .execute()
            
            await self.log_action(
                user_id=user_id,
                profile_id=profile_id,
                action_type='profile_deleted',
                details={'profile_name': profile_name}
            )
            
            return True
        except Exception as e:
            await self.log_action(
                user_id=user_id,
                profile_id=profile_id,
                action_type='profile_delete_failed',
                details={'error': str(e)}
            )
            raise
    
    async def _deactivate_all_profiles(self, user_id: str):
        """Helper: Deactivate all profiles for a user"""
        self.supabase.table('profiles') \
            .update({'is_active': False}) \
            .eq('user_id', user_id) \
            .execute()
    
    async def log_action(self, user_id: str, profile_id: Optional[str], action_type: str, details: Dict[str, Any]):
        """Log an action to the action_log table"""
        try:
            self.supabase.table('action_log').insert({
                'user_id': user_id,
                'profile_id': profile_id,
                'action_type': action_type,
                'action_details': details,
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            # Silently fail logging to avoid breaking main operations
            print(f"Failed to log action: {e}")
    
    async def get_recent_logs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent action logs for a user"""
        try:
            result = self.supabase.table('action_log') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('timestamp', desc=True) \
                .limit(limit) \
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            print(f"Failed to retrieve logs: {e}")
            return []
