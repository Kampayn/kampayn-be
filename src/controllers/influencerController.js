const https = require('https');

const getInstagramInfluencerData = async (request, h) => {
  try {
    const { username } = request.params;

    if (!username) {
      return h
        .response({
          error: 'Username is required',
        })
        .code(400);
    }

    const influencerData = await scrapeInfluencerData(username);

    if (!influencerData) {
      return h
        .response({
          error: 'Failed to fetch influencer data or user not found',
        })
        .code(404);
    }

    return h.response(influencerData).code(200);
  } catch (error) {
    console.error('Error in getInstagramInfluencerData:', error);
    return h
      .response({
        error: 'Internal server error',
      })
      .code(500);
  }
};

const scrapeInfluencerData = (username) => {
  return new Promise((resolve) => {
    fetchUserProfile(username, (user) => {
      if (!user) {
        resolve(null);
        return;
      }

      fetchUserMedia(user, username, (accountInfo) => {
        if (accountInfo) {
          // Return only the required fields
          const simplifiedData = {
            followers: accountInfo.Followers,
            'engagement_rate': parseFloat(
              accountInfo['Engagement Rate'].replace('%', '')
            ),
            'average_likes': parseFloat(accountInfo['Average Likes']),
            'average_comments': parseFloat(accountInfo['Average Comments']),
            'is_professional_account':
              accountInfo['Is Professional Account'] === 'Yes',
            'is_verified': accountInfo['Is Verified'] === 'Yes',
            category: accountInfo.Category,
          };
          resolve(simplifiedData);
        } else {
          resolve(null);
        }
      });
    });
  });
};

const fetchUserProfile = (username, callback) => {
  const profileOptions = {
    hostname: 'i.instagram.com',
    path: `/api/v1/users/web_profile_info/?username=${username}`,
    headers: {
      'User-Agent': 'iphone_ua',
      'x-ig-app-id': '936619743392459',
      Cookie:
        'ig_did=29D22998-CB9E-465C-B5ED-FF942F12E877; datr=lKZ6Z-LaQDXvx7WUqOJGbGs7; ps_l=1; ps_n=1; mid=Z-zrRwAEAAH8lUHz1K3cSCxOi6cL; csrftoken=k6I8KPar2rDFi6qz6J7yclNl6VADtlQe; ds_user_id=5346313638; sessionid=5346313638%3AjqGLpQWLLVFt4H%3A23%3AAYemnWEgZsfWylcwaCkWSRVw9HHs7PfXfLVTTrNXKw; rur="VLL\0545346313638\0541776513384:01f7110767731123ba7af5fbc0a781726a44084f9e9ed7c83c074578a6f63259181e7d66"; wd=295x864',
      'X-CSRFToken': 'k6I8KPar2rDFi6qz6J7yclNl6VADtlQe',
    },
  };

  https
    .get(profileOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);

          if (res.statusCode === 401 || res.statusCode === 429) {
            console.error(`Error ${res.statusCode} for ${username}`);
            callback(null);
            return;
          }

          if (!jsonData.data || !jsonData.data.user) {
            console.error(`User not found for ${username}`);
            callback(null);
            return;
          }

          callback(jsonData.data.user);
        } catch (error) {
          console.error(`Error parsing JSON for ${username}:`, error.message);
          callback(null);
        }
      });
    })
    .on('error', (error) => {
      console.error(`Request error for ${username}:`, error.message);
      callback(null);
    });
};

const fetchUserMedia = (user, username, callback) => {
  const userId = user.id;
  const mediaOptions = {
    hostname: 'i.instagram.com',
    path: `/api/v1/feed/user/${userId}/?count=12`,
    headers: {
      'User-Agent': 'iphone_ua',
      'x-ig-app-id': '936619743392459',
      Cookie:
        'ig_did=29D22998-CB9E-465C-B5ED-FF942F12E877; datr=lKZ6Z-LaQDXvx7WUqOJGbGs7; ps_l=1; ps_n=1; mid=Z-zrRwAEAAH8lUHz1K3cSCxOi6cL; csrftoken=k6I8KPar2rDFi6qz6J7yclNl6VADtlQe; ds_user_id=5346313638; sessionid=5346313638%3AjqGLpQWLLVFt4H%3A23%3AAYemnWEgZsfWylcwaCkWSRVw9HHs7PfXfLVTTrNXKw; rur="VLL\0545346313638\0541776513384:01f7110767731123ba7af5fbc0a781726a44084f9e9ed7c83c074578a6f63259181e7d66"; wd=295x864',
      'X-CSRFToken': 'k6I8KPar2rDFi6qz6J7yclNl6VADtlQe',
    },
  };

  https
    .get(mediaOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);

          if (res.statusCode === 401 || res.statusCode === 429) {
            console.error(`Error ${res.statusCode} for media ${username}`);
            callback(null);
            return;
          }

          const timeline_media = jsonData.items || [];
          let averageLikes = 0;
          let averageComments = 0;
          let engagementRate = 0;

          if (timeline_media.length > 0) {
            const likeCounts = timeline_media.map(
              (item) => item.like_count || 0
            );
            const commentCounts = timeline_media.map(
              (item) => item.comment_count || 0
            );

            averageLikes =
              likeCounts.reduce((sum, count) => sum + count, 0) /
              timeline_media.length;
            averageComments =
              commentCounts.reduce((sum, count) => sum + count, 0) /
              timeline_media.length;
            engagementRate =
              ((averageLikes + averageComments) / user.edge_followed_by.count) *
              100;
          }

          const accountInfo = {
            Followers: user.edge_followed_by.count,
            'Is Verified': user.is_verified ? 'Yes' : 'No',
            'Is Professional Account': user.is_business_account ? 'Yes' : 'No',
            'Average Likes': averageLikes.toFixed(2),
            'Average Comments': averageComments.toFixed(2),
            'Engagement Rate': engagementRate.toFixed(2) + '%',
            Category: user.category_name || 'Not Available',
          };

          callback(accountInfo);
        } catch (error) {
          console.error(
            `Error parsing media JSON for ${username}:`,
            error.message
          );
          callback(null);
        }
      });
    })
    .on('error', (error) => {
      console.error(`Media request error for ${username}:`, error.message);
      callback(null);
    });
};

module.exports = {
  getInstagramInfluencerData,
};
