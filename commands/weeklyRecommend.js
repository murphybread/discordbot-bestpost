const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('이번주추천')
        .setDescription('이번 주의 추천 게시물을 보여줍니다')
        .addStringOption(option =>
            option.setName('채널')
                .setDescription('채널 선택')
                .setRequired(true)
                .addChoices(
                    { name: '함께-나누기', value: '📚│함께-나누기' },
                    { name: '토론하기', value: '🚀│토론하기' },
                    { name: '다시-돌아보기', value: '🧘│다시-돌아보기' },
                ))
        .addStringOption(option =>
            option.setName('주차')
                .setDescription('주차 선택')
                .setRequired(true)
                .addChoices(
                    { name: '0주차', value: 'week0' },
                    { name: '1주차 10.15~10.21', value: 'week1' },
                    { name: '2주차 10.22~10.28', value: 'week2' },
                    { name: '3주차 10.29~11.05', value: 'week3' },
                )),

    async execute(interaction) {
        try {
            const channel = interaction.options.getString('채널');
            const week = interaction.options.getString('주차');

            console.log('Selected channel:', channel); // 디버깅용
            console.log('Selected week:', week); // 디버깅용

            // 임베드 색상 설정
            const colorMap = {
                '📚│함께-나누기': 0x00ff00,  // 초록색
                '🚀│토론하기': 0x0099ff,    // 파란색
                '🧘│다시-돌아보기': 0xff9900 // 주황색
            };

            // 파일 경로 설정
            const filePath = path.join(
                process.cwd(),
                'data',
                `channel_${channel}`,
                week,
                `${week}-top5FormattedPosts.json`
            );

            console.log('Trying to read file:', filePath); // 디버깅용

            // 파일 읽기 시도
            let posts;
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                posts = JSON.parse(data);
            } catch (error) {
                if (!interaction.replied) {
                    return await interaction.reply({
                        content: `${week}의 ${channel} 채널 데이터가 아직 없습니다.`,
                        ephemeral: true
                    });
                }
            }

            // Discord 임베드 메시지 생성
            const embed = {
                color: colorMap[channel] || 0x0099ff,
                title: `${channel} 채널의 ${week} 추천 게시물 TOP 5`,
                description: '가장 많은 반응과 댓글을 받은 게시물들입니다.',
                fields: posts.map((post, index) => ({
                    name: `${index + 1}위: ${post.threadName}`,
                    value: [
                        `👍 반응: ${post.totalReactions}`,
                        `💬 댓글: ${post.messageCount}`,
                        `✍️ 작성자: ${post.author}`,
                        `📅 글 작성날짜: ${post.creationDate}`,
                        `🔗 [게시물 바로가기](${post.threadLink})`
                    ].join('\n')
                })),
                timestamp: new Date(),
                footer: {
                    text: '디스코드 도서관 | 매주 업데이트'
                }
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '데이터를 불러오는 중 오류가 발생했습니다.',
                    ephemeral: true
                });
            }
        }
    },
}; 