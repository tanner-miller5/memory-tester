import React from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Timer,
    Photo,
    Check,
    Schedule,
    EmojiEvents,
    Notifications,
} from '@mui/icons-material';

function Instructions() {
    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
                How Memory Testing Works
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
                <ListItem>
                    <ListItemIcon>
                        <Photo color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Learning Phase"
                        secondary="You will be shown a series of images or videos that you need to memorize"
                    />
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <Timer color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Testing Schedule"
                        secondary="You'll be tested at specific intervals to reinforce your memory"
                    />
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <Check color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Recognition Test"
                        secondary="Select the correct image from multiple options during each test"
                    />
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <Schedule color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Spaced Repetition"
                        secondary="Tests are scheduled at increasing intervals to optimize learning"
                    />
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <Notifications color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Notifications"
                        secondary="You'll be notified when it's time to take your next test"
                    />
                </ListItem>

                <ListItem>
                    <ListItemIcon>
                        <EmojiEvents color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Points System"
                        secondary="Earn points for correct answers and compete on the leaderboard"
                    />
                </ListItem>
            </List>

            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Tip: Make sure to take your tests at the scheduled times for the best results!
                </Typography>
            </Box>
        </Paper>
    );
}

export default Instructions;
