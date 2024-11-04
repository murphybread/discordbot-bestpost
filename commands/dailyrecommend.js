const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('오늘의추천')
        .setDescription('오늘의 추천 게시물을 보여줍니다')
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
                    { name: '3주차 10.29~11.04', value: 'week3' },
                    { name: '4주차 11.05~11.12', value: 'week4' },
                )),
    async execute(interaction) {
        try {
            const channel = interaction.options.getString('채널');
            const today = new Date().toLocaleDateString("ko-KR");
            const week = interaction.options.getString('주차');



            console.log('Selected channel:', channel); // 디버깅용
            console.log('Selected today:', today); // 디버깅용

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
                `${week}-${channel}.json`
            );

            console.log('Trying to read file:', filePath); // 디버깅용

            // 파일 읽기 시도
            let posts;
            let bestPost;
            let todayPosts;
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                posts = JSON.parse(data);

                todayPosts = posts.filter(post => post.creationDate.startsWith(today));
                if (todayPosts.length === 0) {
                    return await interaction.reply({
                        content: `${today}의 ${channel} 채널 데이터가 아직 없습니다.`,
                        ephemeral: true
                    });
                }

                bestPost = todayPosts.reduce((best, current) => {
                    const currentScore = current.totalReactions + current.messageCount;
                    const bestScore = best.totalReactions + best.messageCount;
                    return currentScore > bestScore ? current : best;
                });

            } catch (error) {
                return await interaction.reply({
                    content: `${today}의 ${channel} 채널 데이터가 아직 없습니다.`,
                    ephemeral: true
                });
            }

            // Discord 임베드 메시지 생성
            const embed = {
                color: colorMap[channel] || 0x0099ff,
                title: `${channel} 채널의 ${today} 추천 게시물`,
                description: `가장 많은 반응과 댓글을 받은 게시물들입니다.\n ${today}  등록된 게시글 ${todayPosts.length}\n문의 링크 <@${process.env.USER_ID}>`,
                fields: [{
                    name: `게시글제목: ${bestPost.threadName}`,
                    value: [
                        `👍 반응: ${bestPost.totalReactions}`,
                        `💬 댓글: ${bestPost.messageCount}`,
                        `✍️ 작성자: ${bestPost.author}`,
                        `📅 글 작성날짜: ${bestPost.creationDate}`,
                        `🔗 [게시물 바로가기](${bestPost.threadLink})`,
                    ].join('\n')
                }],
                timestamp: new Date(),
                footer: {
                    text: 'Developed by [FE] 민찬 | 데이터는 1시간마다 업데이트 중'
                }
            };

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error:', error);
            await interaction.reply({
                content: '데이터를 불러오는 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    },
}; 