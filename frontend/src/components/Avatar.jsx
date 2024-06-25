import React from 'react';

function Avatar({ username, userId }) {
    const colors = ['bg-red-300', 'bg-yellow-300', 'bg-purple-300', 'bg-blue-300', 'bg-teal-300', 'bg-pink-300'];
    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];

    // Ensure username is defined and not empty before accessing first character
    const initial = username && username.trim() ? username[0] : '';

    return (
        <div className={`w-9 h-9 rounded-full flex items-center ${color}`}>
            <div className='text-center w-full opacity-70'>{initial}</div>
        </div>
    );
}

export default Avatar;
